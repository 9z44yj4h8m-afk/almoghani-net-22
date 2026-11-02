import { describe, expect, it } from "vitest";
import {
  parseChannelM3u, parseChannelBackup, serializeChannelM3u, validChannelUrl, CHANNEL_BACKUP_FORMAT,
} from "@/lib/channel-transfer";

describe("Manual channel transfer", () => {
  const playlist = [
    "#EXTM3U",
    '#EXTINF:-1 tvg-name="قناة القرآن" group-title="Islamic" tvg-logo="https://example.org/logo.png",قناة القرآن',
    "https://example.org/quran.m3u8",
    '#EXTINF:-1 group-title="Sports",قناة الرياضة',
    "https://example.org/sports.m3u8",
    '#EXTINF:-1 group-title="Sports",تكرار',
    "https://example.org/sports.m3u8",
  ].join("\n");

  it("parses Arabic channels, normalizes sections and removes duplicate links", () => {
    const channels = parseChannelM3u(playlist);
    expect(channels).toHaveLength(2);
    expect(channels[0]).toMatchObject({
      name: "قناة القرآن", category: "إسلامية", logo: "https://example.org/logo.png",
    });
    expect(channels[1]?.category).toBe("رياضية");
  });

  it("round-trips the playlist safely", () => {
    const initial = parseChannelM3u(playlist);
    expect(parseChannelM3u(serializeChannelM3u(initial))).toEqual(initial);
  });

  it("rejects single-stream manifests and non-web addresses", () => {
    expect(() => parseChannelM3u("#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6")).toThrow();
    expect(validChannelUrl("javascript:alert(1)")).toBe(false);
    expect(validChannelUrl("file:///test")).toBe(false);
  });

  it("requires a recognized backup format and does not duplicate restored links", () => {
    const content = JSON.stringify({
      format: CHANNEL_BACKUP_FORMAT,
      channels: [
        { name: "قناة", category: "عامة", url: "https://example.org/live.m3u8", logo: "" },
        { name: "نسخة", category: "عامة", url: "https://example.org/live.m3u8", logo: "" },
      ],
    });
    expect(parseChannelBackup(content)).toHaveLength(1);
    expect(() => parseChannelBackup('{"channels":[]}')).toThrow();
  });
});
