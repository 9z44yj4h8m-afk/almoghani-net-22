import { describe, expect, it } from "vitest";
import { channels as baseChannels } from "@/lib/channels";
import { mergeChannels, type SiteConfig } from "@/lib/site-config";

describe("Admin stream URL overrides", () => {
  const base = baseChannels.find((channel) => !!channel.streamUrl);
  if (!base) throw new Error("Test requires at least one built-in stream");

  const makeConfig = (overrides: SiteConfig["overrides"], customChannels: SiteConfig["customChannels"] = []) =>
    ({ overrides, customChannels } as SiteConfig);

  it("uses an edited HLS address for a built-in channel", () => {
    const changed = mergeChannels(makeConfig([{ channel_id: base.id, hidden: false, category: null, name: null, stream_url: "https://example.org/new.m3u8" }]));
    expect(changed.find((channel) => channel.id === base.id)?.streamUrl).toBe("https://example.org/new.m3u8");
  });

  it("can switch a built-in channel from HLS to a YouTube player", () => {
    const changed = mergeChannels(makeConfig([{ channel_id: base.id, hidden: false, category: null, name: null, stream_url: "https://www.youtube.com/watch?v=OAAEbezyJnU" }]));
    const channel = changed.find((c) => c.id === base.id);
    expect(channel?.youtubeId).toBe("OAAEbezyJnU");
    expect(channel?.streamUrl).toBeUndefined();
  });

  it("applies saved override URLs to manually added channels", () => {
    const channel = {
      id: "test-custom", name: "تجريبية", category: "عامة",
      stream_url: "https://example.org/old.m3u8", logo: "", description: "",
    };
    const changed = mergeChannels(makeConfig([
      { channel_id: channel.id, hidden: false, category: null, name: null, stream_url: "https://example.org/new.m3u8" },
    ], [channel]));
    expect(changed.find((c) => c.id === channel.id)?.streamUrl).toBe("https://example.org/new.m3u8");
  });
});
