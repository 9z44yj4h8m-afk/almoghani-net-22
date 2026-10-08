import { createFileRoute } from "@tanstack/react-router";
import { voiceMonologue } from "@/lib/chat-bots.functions";
import { normalizeVoiceChat } from "@/lib/voice-config";

function pickVoice(name: string, list: string[]) {
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return list[h % list.length] ?? "Leda";
}

// Generates one spoken bot turn. Text is server-chosen, so this cannot be used as a free TTS service.
export const Route = createFileRoute("/api/public/bot-voice-turn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { previous, heard, fast } = (await request.json().catch(() => ({}))) as { previous?: string; heard?: string; fast?: boolean };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin.from("site_settings").select("value").eq("key", "voice_chat").maybeSingle();
        const cfg = normalizeVoiceChat(row?.value);
        if (!cfg.enabled) return new Response("disabled", { status: 403, headers: { "X-Voice-Disabled": "1" } });
        const available = [{ name: "نغم 🎶", path: cfg.recordings.song }, { name: "قصيدة 🌹", path: cfg.recordings.poem }].filter((r) => r.path && r.name !== previous);
        const recording = fast === true ? available.find((r) => r.name === "نغم 🎶") : !heard && Math.random() < 0.35 ? available[Math.floor(Math.random() * available.length)] : undefined;
        if (recording) {
          const { data: audio, error } = await supabaseAdmin.storage.from("chat-recordings").download(recording.path);
          if (!error && audio) return new Response(audio, { headers: { "Content-Type": audio.type || "audio/mpeg", "X-Bot-Name": encodeURIComponent(recording.name), "X-Turn-Ms": String(cfg.turnSeconds * 1000), "Cache-Control": "no-store" } });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("not configured", { status: 500 });
        const { name, text, female, mode } = await voiceMonologue(String(previous ?? "").slice(0, 40), String(heard ?? "").slice(0, 400), fast === true, cfg.openers);
        const voice = cfg.botVoices[name] ?? (mode === "sing" ? "Leda" : mode === "poem" ? "Achernar" : null) ?? (fast === true && female ? "Leda" : null) ?? pickVoice(name, female ? cfg.femaleVoices : cfg.maleVoices);
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `${mode === "sing" ? "غنيها بصوت بنت ناعم عذب ورقيق جدا، بلحن هادئ حالم وطرب خليجي، مدّي الكلمات كأنك تغنين" : mode === "poem" ? "ألقيها بصوت بنت ناعم رقيق، بإلقاء شعري هادئ مؤثر ووقفات بين الأبيات" : fast === true && female ? "قوليها بصوت بنت شابة ناعم وعذب ورقيق جدا، بنبرة هادئة حالمة كأنها تدندن، بلهجة خليجية ودودة" : "قلها بلهجة خليجية ودودة وعفوية"}: ${text}` }] }],
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
