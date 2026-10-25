import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("IPTV-compatible public export", () => {
  it("excludes the foreign bulk expansion while retaining the previous playlist and Arabic additions", () => {
    for (const filename of ["public/channels.m3u", "public/channels-iptv.m3u", "public/c.m3u"]) {
      const content = readFileSync(filename, "utf8");
      expect(content).not.toContain('group-title="الأجنبية —');
      expect(content).toContain('group-title="العربية —');
      expect(content).toContain("روتانا سينما السعودية");
    }
  });

  it("exports every direct HLS entry in source order without YouTube pages", () => {
    const source = readFileSync("public/channels.m3u", "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
    const expected = source.filter((line) => line.startsWith("https://") && new URL(line).pathname.endsWith(".m3u8"));
    const compatible = readFileSync("public/channels-iptv.m3u", "utf8");
    const lines = compatible.split("\r\n");
    expect(lines[0]).toBe("#EXTM3U");
    expect(lines.filter((line) => line.startsWith("https://"))).toEqual(expected);
    expect(expected.length).toBeGreaterThan(0);
    expect(lines.filter((line) => line.startsWith("#EXTINF:"))).toHaveLength(expected.length);
    expect(compatible).not.toContain("youtube.com");
    expect(compatible.charCodeAt(0)).toBe(35);
  });

  it("keeps the short link c.m3u identical to channels.m3u", () => {
    expect(readFileSync("public/c.m3u", "utf8")).toBe(readFileSync("public/channels.m3u", "utf8"));
  });

  it("preserves the verified Rotana playback headers for every Rotana CDN entry", () => {
    for (const filename of ["public/channels.m3u", "public/channels-iptv.m3u"]) {
      const lines = readFileSync(filename, "utf8").split(/\r?\n/);
      const indexes = lines.flatMap((line, index) => line.startsWith("https://rotana.hibridcdn.net/") ? [index] : []);
      expect(indexes.length).toBeGreaterThan(0);
      for (const index of indexes) {
        expect(lines[index - 3]).toBe("#EXTVLCOPT:http-referrer=https://rotana.net/");
        expect(lines[index - 2]).toBe("#EXTVLCOPT:http-origin=https://rotana.net");
        expect(lines[index - 1]).toBe("#EXTVLCOPT:http-user-agent=Mozilla/5.0");
      }
    }
  });
});