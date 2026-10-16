// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { channels } from "@/lib/channels";

describe("Public channel catalog", () => {
  it("keeps channel identifiers unique for player deep links", () => {
    expect(new Set(channels.map((channel) => channel.id)).size).toBe(channels.length);
  });

  it("keeps the Arabic playlist in UTF-8 with a BOM", () => {
    const playlist = readFileSync("public/channels.m3u");
    expect([...playlist.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(playlist.toString("utf8")).toContain("الأردن دراما — التلفزيون الأردني");
  });

  it("preserves Saudi, MBC, Gulf, general and news ordering", () => {
    const playlist = readFileSync("public/channels.m3u", "utf8");
    const groups = ["السعودية", "مجموعة MBC", "دول الخليج", "العامة", "الإخبارية"];
    const positions = groups.map((group) => playlist.indexOf(`group-title="${group}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    const firstGeneral = playlist.split("\n").find((line) => line.includes('group-title="العامة"'));
    expect(firstGeneral?.split(",").at(-1)).toBe("الأردن دراما — التلفزيون الأردني");
  });
});