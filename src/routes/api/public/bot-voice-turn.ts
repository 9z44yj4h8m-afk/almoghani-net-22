import { createFileRoute } from "@tanstack/react-router";
import { voiceMonologue } from "@/lib/chat-bots.functions";
import { normalizeVoiceChat } from "@/lib/voice-config";

function pickVoice(name: string, list: string[]) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return list[h % list.length]!;
}

// Generates one spoken bot turn. Text is server-chosen, so this cannot be used as a free TTS service.
export const Route = createFileRoute("/api/public/bot-voice-turn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { previous, heard, fast } = (await request.json().catch(() => ({}))) as { previous?: string; heard?: string; fast?: boolean };
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("not configured", { status: 500 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin.from("site_settings").select("value").eq("key", "voice_chat").maybeSingle();
        const cfg = normalizeVoiceChat(row?.value);
        if (!cfg.enabled) return new Response("disabled", { status: 403, headers: { "X-Voice-Disabled": "1" } });
        const { name, text, female } = await voiceMonologue(String(previous ?? "").slice(0, 40), String(heard ?? "").slice(0, 400), fast === true, cfg.openers);
        const voice = cfg.botVoices[name] ?? (fast === true && female ? "Achernar" : null) ?? pickVoice(name, female ? cfg.femaleVoices : cfg.maleVoices);
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `${fast === true && female ? "قوليها بصوت بنت ناعم وهادئ ورقيق، بلهجة خليجية ودودة" : "قلها بلهجة خليجية ودودة وعفوية"}: ${text}` }] }],
            generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
            stream_format: "audio",
          }),
        });
        if (!res.ok) return new Response(await res.text(), { status: res.status });
        return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/wav", "X-Bot-Name": encodeURIComponent(name), "X-Turn-Ms": String(cfg.turnSeconds * 1000), "Cache-Control": "no-store" } });
      },
    },
  },
});
