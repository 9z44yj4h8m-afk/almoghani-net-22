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
  dom.window.eval((script.textContent || '') + ';window.readState = source => eval(source);');
  dom.window.confirm = () => true;
  return dom.window as typeof dom.window & { readState: (source: string) => any };
}
afterEach(() => windows.splice(0).forEach(dom => dom.window.close()));
describe('standalone IPTV channel controls', () => {
  it('selects card editing without changing channel data or applying a draft', () => {
    const w = setup();
    const before = w.readState('JSON.stringify(data)');
    w.readState('selectDesignTarget("cards")');
    expect(w.readState('selectedDesignTarget')).toBe('cards');
    expect(w.readState('JSON.stringify(data)')).toBe(before);
    w.readState('selectDesignTarget("unknown")');
    expect(w.readState('selectedDesignTarget')).toBe('cards');
  });
  it('bounds layout dimensions to keep channel cards and content contained', () => {
    const w = setup();
    const d = w.readState('normalizeDesign({cardMin:1,cardHeight:9999,cardGap:-10,contentWidth:9999})');
    expect(d.cardMin).toBe(100);
    expect(d.cardHeight).toBe(360);
    expect(d.cardGap).toBe(0);
    expect(d.contentWidth).toBe(1920);
  });
  it('adds one channel with the supplied name and stream', async () => {
    const w = setup();
    w.readState('document.getElementById("chName").value="الوسام";document.getElementById("chUrl").value="https://stream.addresses-sat.com/Alwesam/index.m3u8"');
    await w.readState('saveChannel()');
    expect(w.readState('data.channels.length')).toBe(44);
    expect(w.readState('data.channels.at(-1).name')).toBe('الوسام');
  });
  it('deletes only the selected channel and preserves films', () => {
    const w = setup();
    w.readState('data.movies=[{id:"film",name:"Movie"}];deleteChannel("1")');
    expect(w.readState('data.channels.length')).toBe(42);
    expect(w.readState('data.channels.some(x=>x.id==="1")')).toBe(false);
    expect(w.readState('data.movies[0].id')).toBe('film');
  });
  it('deletes every channel without deleting films or groups and restores them', () => {
    const w = setup();
    w.readState('data.movies=[{id:"film",name:"Movie"}];deleteAllChannels()');
    expect(w.readState('data.channels.length')).toBe(0);
    expect(w.readState('data.movies.length')).toBe(1);
    expect(w.readState('data.groups.length')).toBe(9);
    w.readState('restoreDeletedChannels()');
    expect(w.readState('data.channels.length')).toBe(43);
  });
  it('leaves all channels untouched when deletion is cancelled', () => {
    const w = setup();
    w.confirm = () => false;
    w.readState('deleteAllChannels();deleteChannel("1")');
    expect(w.readState('data.channels.length')).toBe(43);
  });
  it('retains saved deletion after reloading rather than restoring defaults', () => {
    const w = setup();
    w.readState('deleteAllChannels()');
    const saved = w.localStorage.getItem('almoghaniControlV3');
    expect(JSON.parse(saved || '{}').channels).toEqual([]);
  });
  it('keeps design changes in draft until applied and supports undo', () => {
    const w = setup();
    w.readState('document.getElementById("cardGap").value="30";recordDesignDraft()');
    expect(w.readState('designHistory[designIndex].cardGap')).toBe(30);
    expect(w.readState('normalizeDesign(data.design).cardGap')).toBe(13);
    w.readState('stepDesign(-1)');
    expect(w.readState('designHistory[designIndex].cardGap')).toBe(13);
    w.readState('stepDesign(1);saveDesign()');
    expect(w.readState('data.design.cardGap')).toBe(30);
  });
});