import { describe, expect, it } from "vitest";
import { FEMALE_VOICE_PROFILES, normalizeVoiceChat, providerVoiceId, voiceDelivery } from "@/lib/voice-config";

describe("soft female voice presets", () => {
  it("keeps distinct delivery profiles and persists the selected bot voice", () => {
    const ids = ["female-raheel", "female-areej", "female-hatoon", "female-taleen"];
    const providers = new Set<string>();
    const deliveries = new Set<string>();
    for (const id of ids) {
      const profile = FEMALE_VOICE_PROFILES.find((voice) => voice.id === id);
      expect(profile?.female).toBe(true);
      expect(voiceDelivery(id)).toContain("امرأة بالغة");
      providers.add(providerVoiceId(id));
      deliveries.add(voiceDelivery(id));
      expect(normalizeVoiceChat({ botVoices: { نورة: id } }).botVoices.نورة).toBe(id);
    }
    expect(providers.size).toBe(ids.length);
    expect(deliveries.size).toBe(ids.length);
  });
});