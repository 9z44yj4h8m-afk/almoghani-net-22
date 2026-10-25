import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { channels } from "@/lib/channels";

describe("Public channel catalog", () => {
  it.each([
    ["w-ifilm-arabic", "https://live.presstv.co.uk/hls/ifilmar_4_482/index.m3u8", "https://live.presstv.co.uk/hls/ifilmar.m3u8"],
    ["tg-ps-al-madina", "https://streaming.zaytonatube.com:8081/AlMadinatv/almadina21/tracks-v1a1/mono.ts.m3u8", "https://streaming.zaytonatube.com:8081/AlMadinatv/almadina21/index.m3u8"],
  ])("keeps the verified playable rendition for %s in every export", (id, url, previousUrl) => {
    expect(channels.find((channel) => channel.id === id)?.streamUrl).toBe(url);
    for (const filename of ["public/c.m3u", "public/channels.m3u", "public/channels-iptv.m3u"]) {
      const lines = readFileSync(filename, "utf8").split(/\r?\n/);
      expect(lines).toContain(url);
      expect(lines).not.toContain(previousUrl);
    }
  });

  it("uses the verified NHK source in the site and both public playlists", () => {
    const url = "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8";
    expect(channels.find((channel) => channel.id === "w-nhk-world-japan-hd")?.streamUrl).toBe(url);
    for (const filename of ["public/channels.m3u", "public/channels-iptv.m3u"]) {
      const playlist = readFileSync(filename, "utf8");
      expect(playlist.split(/\r?\n/)).toContain(url);
      expect(playlist).not.toContain("https://freem3u.xyz/api/live/play.m3u8?vid=106");
    }
  });
  it("includes each verified addition once in the catalog and export", () => {
    const playlist = readFileSync("public/channels.m3u", "utf8");
    for (const id of ["extra-karbala-documentary", "extra-mta-arabia", "extra-zagros", "extra-iraq-quran", "extra-elsharq-tv", "extra-hala-tv", "extra-makan33", "extra-mekameleen"]) {
      const matches = channels.filter((channel) => channel.id === id);
      expect(matches).toHaveLength(1);
      const channel = matches[0];
      expect(channel?.streamUrl).toMatch(/^https:\/\//);
      expect(playlist.split("\n").filter((line) => line === channel?.streamUrl)).toHaveLength(1);
    }
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