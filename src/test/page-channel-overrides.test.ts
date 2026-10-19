import { describe, expect, it } from "vitest";
import { mergeChannels, type SiteConfig } from "@/lib/site-config";

const config = {
  customChannels: [{ id: "custom-test", name: "القناة الأصلية", category: "عامة", stream_url: "https://example.com/stream.m3u8", logo: "", description: "بث" }],
  overrides: [{ channel_id: "custom-test", name: "قناتي", category: "رياضية", hidden: false, logo: "https://example.com/logo.webp", sort_order: 0 }],
} as SiteConfig;
describe("In-page channel changes reach the shared catalog", () => {
  it("applies the saved name to added channels", () => { expect(mergeChannels(config)[0]?.name).toBe("قناتي"); });
  it("applies the saved section to added channels", () => { expect(mergeChannels(config)[0]?.category).toBe("رياضية"); });
  it("applies the saved image to added channels", () => { expect(mergeChannels(config)[0]?.thumbnail).toBe("https://example.com/logo.webp"); });
  it("puts a channel saved at position zero first in all channels", () => { expect(mergeChannels(config)[0]?.id).toBe("custom-test"); });
  it("hides channels without deleting the saved record", () => {
    const hidden = { ...config, overrides: config.overrides.map(o => ({ ...o, hidden: true })) };
    expect(mergeChannels(hidden).some(c => c.id === "custom-test")).toBe(false);
    expect(hidden.customChannels[0]?.id).toBe("custom-test");
  });
});