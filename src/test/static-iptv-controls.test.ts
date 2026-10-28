import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';

const html = readFileSync('public/iptv.html', 'utf8');
const windows: JSDOM[] = [];
function setup() {
  const dom = new JSDOM(html, { url: 'https://almoghani.net/iptv.html', runScripts: 'outside-only' });
  windows.push(dom);
  const script = [...dom.window.document.querySelectorAll('script')].find(el => !el.src && el.type !== 'application/json');
  if (!script) throw new Error('Missing page script');
  dom.window.eval(script.textContent || '');
  dom.window.confirm = () => true;
  return dom.window;
}
afterEach(() => windows.splice(0).forEach(dom => dom.window.close()));
describe('standalone IPTV channel controls', () => {
  it('adds one channel with the supplied name and stream', async () => {
    const w = setup();
    w.eval('document.getElementById("chName").value="الوسام";document.getElementById("chUrl").value="https://stream.addresses-sat.com/Alwesam/index.m3u8"');
    await w.eval('saveChannel()');
    expect(w.eval('data.channels.length')).toBe(44);
    expect(w.eval('data.channels.at(-1).name')).toBe('الوسام');
  });
  it('deletes only the selected channel and preserves films', () => {
    const w = setup();
    w.eval('data.movies=[{id:"film",name:"Movie"}];deleteChannel("1")');
    expect(w.eval('data.channels.length')).toBe(42);
    expect(w.eval('data.channels.some(x=>x.id==="1")')).toBe(false);
    expect(w.eval('data.movies[0].id')).toBe('film');
  });
  it('deletes every channel without deleting films or groups and restores them', () => {
    const w = setup();
    w.eval('data.movies=[{id:"film",name:"Movie"}];deleteAllChannels()');
    expect(w.eval('data.channels.length')).toBe(0);
    expect(w.eval('data.movies.length')).toBe(1);
    expect(w.eval('data.groups.length')).toBe(9);
    w.eval('restoreDeletedChannels()');
    expect(w.eval('data.channels.length')).toBe(43);
  });
  it('leaves all channels untouched when deletion is cancelled', () => {
    const w = setup();
    w.confirm = () => false;
    w.eval('deleteAllChannels();deleteChannel("1")');
    expect(w.eval('data.channels.length')).toBe(43);
  });
  it('retains saved deletion after reloading rather than restoring defaults', () => {
    const w = setup();
    w.eval('deleteAllChannels()');
    const saved = w.localStorage.getItem('almoghaniControlV3');
    expect(JSON.parse(saved || '{}').channels).toEqual([]);
  });
  it('keeps design changes in draft until applied and supports undo', () => {
    const w = setup();
    w.eval('document.getElementById("cardGap").value="30";recordDesignDraft()');
    expect(w.eval('designHistory[designIndex].cardGap')).toBe(30);
    expect(w.eval('normalizeDesign(data.design).cardGap')).toBe(13);
    w.eval('stepDesign(-1)');
    expect(w.eval('designHistory[designIndex].cardGap')).toBe(13);
    w.eval('stepDesign(1);saveDesign()');
    expect(w.eval('data.design.cardGap')).toBe(30);
  });
});