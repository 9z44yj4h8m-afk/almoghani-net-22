import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bulkChannels } from "@/lib/bulk-channels";
import { channels } from "@/lib/channels";

describe("Verified public IPTV-org additions", () => {
  it("includes every new channel exactly once in the shared catalog and all exports", () => {
    expect(bulkChannels.length).toBeGreaterThan(0);
    const ids = channels.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const filename of ["public/channels.m3u", "public/channels-iptv.m3u", "public/c.m3u"]) {
      const counts = new Map<string, number>();
      for (const line of readFileSync(filename, "utf8").split(/\r?\n/)) counts.set(line, (counts.get(line) ?? 0) + 1);
      for (const c of bulkChannels) {
        expect(ids.filter(id => id === c.id)).toHaveLength(1);
        expect(counts.get(c.streamUrl ?? "")).toBe(1);
        expect(c.id.startsWith("smarters:")).toBe(false);
        expect(new URL(c.streamUrl ?? "").protocol).toBe("https:");
      }
    }
  });
  it("puts the new Arabic channels before the new foreign channels", () => {
    const arabic = bulkChannels.filter(c => c.description.startsWith("قناة عربية"));
    const foreign = bulkChannels.filter(c => c.description.startsWith("قناة أجنبية"));
    expect(arabic.length).toBeGreaterThan(0);
    expect(foreign.length).toBeGreaterThan(0);
    const arabicPositions = arabic.map(c => channels.findIndex(item => item.id === c.id));
    const foreignPositions = foreign.map(c => channels.findIndex(item => item.id === c.id));
    expect(Math.max(...arabicPositions)).toBeLessThan(Math.min(...foreignPositions));
  });
});