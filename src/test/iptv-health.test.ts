import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const html = readFileSync('public/iptv.html', 'utf8');
const windows: JSDOM[] = [];
function setup() {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://almoghani.net/iptv.html' });
  windows.push(dom);
  const source = html.match(/const DOT_CODE=`([\s\S]*?)`;/)?.[1];
  if (!source) throw new Error('Missing health logic');
  dom.window.eval('let data={channels:[],movies:[]};' + source);
  const w = dom.window;
  const health = (w as any).liveHealth;
  const video = w.document.getElementById('video') as HTMLVideoElement;
  Object.defineProperty(video, 'readyState', { value: 2 });
  return { w, health, video };
}
afterEach(() => { windows.splice(0).forEach(w => w.window.close()); vi.restoreAllMocks(); });
const channel = { id: 'test', url: 'https://example.org/live.m3u8' };
describe('IPTV playback evidence', () => {
  it('does not mark green before playback actually advances', () => {
    const { w, health, video } = setup();
    health.begin(channel, video, false);
    video.dispatchEvent(new w.Event('playing'));
    expect(health.read(channel).state).toBe('unknown');
    video.currentTime = 1;
    video.dispatchEvent(new w.Event('timeupdate'));
    expect(health.read(channel).state).toBe('ok');
  });
  it('marks a media failure red, then allows a successful retry', () => {
    const { w, health, video } = setup();
    health.begin(channel, video, false);
    video.dispatchEvent(new w.Event('error'));
    expect(health.read(channel).state).toBe('bad');
    health.begin(channel, video, false);
    expect(health.read(channel).state).toBe('unknown');
    video.currentTime = 2;
    video.dispatchEvent(new w.Event('timeupdate'));
    expect(health.read(channel).state).toBe('ok');
  });
  it('does not presume YouTube links are playing', () => {
    const { health, video } = setup();
    health.begin({ id: 'yt', url: 'https://youtube.com/watch?v=abcdefghijk' }, video, true);
    expect(health.read({ id: 'yt', url: 'https://youtube.com/watch?v=abcdefghijk' }).state).toBe('unknown');
  });
  it('keeps duplicate names and changed links independent', () => {
    const { health } = setup();
    health.set({ ...channel, name: 'قناة' }, 'ok', 'playing');
    expect(health.read({ id: 'other', name: 'قناة', url: channel.url }).state).toBe('unknown');
    expect(health.read({ ...channel, url: 'https://example.org/new.m3u8' }).state).toBe('unknown');
  });
  it('ignores media events after the player is closed', () => {
    const { health, video, w } = setup();
    health.begin(channel, video, false);
    health.stop();
    video.dispatchEvent(new w.Event('error'));
    expect(health.read(channel).state).toBe('unknown');
  });
  it('does not treat CORS or opaque responses as proof of playback', async () => {
    const { w } = setup();
    const source = html.slice(html.indexOf('async function testUrl'), html.indexOf('async function checkBroken'));
    w.eval('function yt(){return null};' + source);
    (w as any).fetch = vi.fn().mockResolvedValue({ ok: true, type: 'opaque', status: 0 });
    expect(await (w as any).testUrl(channel.url)).toBe('unknown');
    (w as any).fetch = vi.fn().mockRejectedValue(new TypeError('CORS'));
    expect(await (w as any).testUrl(channel.url)).toBe('unknown');
    (w as any).fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    expect(await (w as any).testUrl(channel.url)).toBe('bad');
  });
});