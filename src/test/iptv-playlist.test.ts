import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("IPTV-compatible public export", () => {
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
});