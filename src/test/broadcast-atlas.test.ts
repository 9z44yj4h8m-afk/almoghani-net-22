import { describe, expect, it } from "vitest";
import { appendAtlasChannels, filterAtlasChannels, importAtlasPlaylist, type AtlasChannel } from "@/lib/broadcast-atlas";
const current: AtlasChannel[] = [
  { id: "saudi", name: "السعودية الأولى", category: "عامة", thumbnail: "", description: "", streamUrl: "https://example.com/sa.m3u8" },
  { id: "radio", name: "راديو الخزامى", category: "عامة", thumbnail: "", description: "", streamUrl: "https://example.com/radio.m3u8" },
  { id: "news", name: "الجزيرة", category: "إخبارية", thumbnail: "", description: "" },
];
describe("Broadcast atlas channel rules", () => {
  it("keeps every existing channel when adding a local M3U", () => {
    const imported = importAtlasPlaylist('#EXTM3U\n#EXTINF:-1 group-title="news",قناة محلية\nhttps://example.com/local.m3u8\n', "test");
    const merged = appendAtlasChannels(current, imported);
    expect(merged.slice(0, 3)).toEqual(current);
    expect(merged[3]?.name).toBe("قناة محلية");
    expect(merged[3]?.category).toBe("إخبارية");
  });
  it("does not duplicate an existing source during local import", () => {
    const imported = importAtlasPlaylist('#EXTM3U\n#EXTINF:-1,الأولى\nhttps://example.com/sa.m3u8\n', "test");
    expect(appendAtlasChannels(current, imported)).toEqual(current);
  });
  it("filters Saudi channels without deleting non-Saudi entries", () => {
    expect(filterAtlasChannels(current, "", "sa", "all", "all").map(c => c.id)).toEqual(["saudi", "radio"]);
    expect(filterAtlasChannels(current, "", "all", "all", "all")).toEqual(current);
  });
  it("separates radio from television", () => {
    expect(filterAtlasChannels(current, "", "all", "radio", "all").map(c => c.id)).toEqual(["radio"]);
    expect(filterAtlasChannels(current, "", "all", "tv", "all").map(c => c.id)).toEqual(["saudi", "news"]);
  });
  it("combines Arabic search with the chosen category", () => {
    expect(filterAtlasChannels(current, "الجَزِيـرة", "all", "all", "إخبارية").map(c => c.id)).toEqual(["news"]);
    expect(filterAtlasChannels(current, "الجزيرة", "all", "all", "عامة")).toEqual([]);
  });
});