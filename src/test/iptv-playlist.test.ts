import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("IPTV-compatible public export", () => {
  it("excludes the foreign bulk expansion while retaining the previous playlist and Arabic additions", () => {
    for (const filename of ["public/channels.m3u", "public/channels-iptv.m3u", "public/c.m3u"]) {
      const content = readFileSync(filename, "utf8");
      expect(content).not.toContain('group-title="الأجنبية —');
      if (filename !== "public/c.m3u") expect(content).toContain('group-title="العربية —');
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

  it("keeps only requested sections while preserving their source entries and playback directives", () => {
    const entries = (file: string) => readFileSync(file, "utf8").split(/(?=^#EXTINF:)/m).slice(1)
      .map(block => block.replace(/group-title="[^"]*"/g, '').trim()).sort();
    const curated = entries("public/c.m3u");
    const source = entries("public/channels.m3u");
    expect(curated.length).toBeGreaterThan(204);
    for (const entry of curated) expect(source).toContain(entry);
    expect(source).toHaveLength(530);
  });

  it("orders the public short playlist into the owner's nine named sections", () => {
    const content = readFileSync("public/c.m3u", "utf8");
    const groups = [...content.matchAll(/group-title="([^"]*)"/g)].map(match => match[1]);
    const sections = groups.filter((group, index) => index === 0 || group !== groups[index - 1]);
    expect(sections).toEqual(['المفضلة', 'القنـوات الأخبــارية', 'القنـوات السعـودية', 'القنـوات البـدوية', 'MBC', 'ROTANA', 'القنـوات الكويتيه', 'القنـوات الخليجية', 'القنـوات المتبقية']);
    expect(content).toMatch(/group-title="القنـوات الكويتيه",تلفزيون الكويت 1/);
    expect(content).toMatch(/group-title="MBC",MBC 1\n/);
    expect(content).toMatch(/group-title="ROTANA",روتانا سينما السعودية/);
  });

  it("retains only Gulf channels in the remaining section", () => {
    const blocks = readFileSync("public/c.m3u", "utf8").split(/(?=^#EXTINF:)/m).slice(1);
    const remaining = blocks.filter(block => block.includes('group-title="القنـوات المتبقية"'));
    const names = remaining.map(block => block.split('\n')[0]?.split('group-title="القنـوات المتبقية",')[1]);
    expect(names).toEqual(['اقرأ — القرآن', 'اقرأ — عالمي', 'أفلام', 'أفلام أكشن', 'أفلام إثارة', 'أطفال ومواهب', 'باب الحارة', 'مرايا', 'بيغ تايم بلس', 'الشلال', 'مغامرات منصور', 'طرب', 'محمد عبده', 'عبدالمجيد عبدالله', 'راشد الماجد', 'ماجد المهندس', 'رابح صقر', 'Asharq Radio', 'الرسالة', 'الشرق ديسكفري', 'الشرق الوثائقية', 'الشرق ديسكفري مباشر', 'Al Arabiya Business (1080p)']);
    expect(names).not.toContain('CNN');
    expect(names).not.toContain('الوطنية التونسية 2');
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