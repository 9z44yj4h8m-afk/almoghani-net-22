import { describe, expect, it } from "vitest";
import { orderedSectionIds, getSectionCard, defaultSectionContent } from "@/lib/section-content";
import { normalizeVoiceChat } from "@/lib/voice-config";

describe("admin content controls", () => {
  it("keeps valid saved order and fills missing cards without duplicates", () => {
    expect(orderedSectionIds("sections", ["a", "b", "c"], { ...defaultSectionContent, orders: { sections: ["c", "c", "invalid", "a"] } })).toEqual(["c", "a", "b"]);
  });
  it("retains hidden state and refuses unapproved destinations", () => {
    const card = getSectionCard("sections-live", { ...defaultSectionContent, cards: { "sections-live": { hidden: true, link: "https://unapproved.example" } } });
    expect(card.hidden).toBe(true);
    expect(card.link).toBe("/live");
  });
  it("only accepts configured recording paths", () => {
    const cfg = normalizeVoiceChat({ clips: [
      { id: "one", name: "سلمى", path: "recordings/abc-123.mp3", enabled: true },
      { id: "two", name: "bad", path: "../private.mp3", enabled: true },
      { id: "three", name: "off", path: "recordings/def.wav", enabled: false },
    ] });
    expect(cfg.clips).toHaveLength(2);
    expect(cfg.clips[1]?.enabled).toBe(false);
    expect(normalizeVoiceChat({}).clips).toEqual([]);
  });
});