// Owner-only voice preview: speaks admin-written text with a chosen voice via Lovable AI Gateway.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VOICE_LIST, voiceDelivery } from "@/lib/voice-config";

export const previewVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().trim().min(1).max(200), voice: z.string().max(40).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("not configured");
    const voice = data.voice && VOICE_LIST.some((v) => v.id === data.voice) ? data.voice : "Leda";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-tts-preview",
        contents: [{ role: "user", parts: [{ text: `${voiceDelivery(voice)}: ${data.text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        stream_format: "audio",
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { audio: btoa(bin) };
  });
