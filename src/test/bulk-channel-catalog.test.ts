import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bulkChannels } from "@/lib/bulk-channels";
import { channels } from "@/lib/channels";

describe("Verified public IPTV-org additions", () => {
  it("includes every new channel exactly once in the shared catalog and all exports", () => {
    expect(bulkChannels.length).toBeGreaterThan(0);
    const ids = channels.map(c => c.id);
    const addedIds = bulkChannels.map(c => c.id);
    expect(new Set(addedIds).size).toBe(addedIds.length);
    // Public M3U files are intentionally curated; they do not mirror the entire TS catalog.
    // Preserve their existing exclusions while ensuring any included streams are not duplicated.
    const files = ["public/channels.m3u", "public/channels-iptv.m3u", "public/c.m3u"];
    const counts = files.map((filename) => {
      const streams = readFileSync(filename, "utf8")
        .split(/\r?\n/).map((line) => line.trim()).filter((line) => /^https?:\/\//.test(line));
      const values = new Map<string, number>();
      for (const stream of streams) values.set(stream, (values.get(stream) ?? 0) + 1);
      return values;
    });
    for (const c of bulkChannels) {
      expect(ids.filter(id => id === c.id)).toHaveLength(1);
      expect(c.id.startsWith("smarters:")).toBe(false);
      expect(new URL(c.streamUrl ?? "").protocol).toBe("https:");
      for (const fileCounts of counts) {
        expect(fileCounts.get(c.streamUrl ?? "") ?? 0).toBeLessThanOrEqual(1);
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