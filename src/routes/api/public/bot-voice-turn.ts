import { createFileRoute } from "@tanstack/react-router";
import { voiceMonologue } from "@/lib/chat-bots.functions";

const VOICES = ["Puck", "Charon", "Fenrir", "Orus", "Kore", "Aoede", "Leda", "Zephyr"];
function voiceFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return VOICES[h % VOICES.length];
}

// Generates one spoken bot turn. Text is server-chosen, so this cannot be used as a free TTS service.
export const Route = createFileRoute("/api/public/bot-voice-turn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { previous } = (await request.json().catch(() => ({}))) as { previous?: string };
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("not configured", { status: 500 });
        const { name, text } = await voiceMonologue(String(previous ?? "").slice(0, 40));
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `قلها بلهجة خليجية ودودة وعفوية: ${text}` }] }],
            generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceFor(name) } } } },
            stream_format: "audio",
          }),
        });
        if (!res.ok) return new Response(await res.text(), { status: res.status });
        return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/wav", "X-Bot-Name": encodeURIComponent(name), "Cache-Control": "no-store" } });
      },
    },
  },
});
