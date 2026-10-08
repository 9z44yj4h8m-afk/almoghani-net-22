import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const BOTS = [
  { name: "🤖 بوت المغني", style: "مرح وودود، يرحب بالناس ويسولف عن البث والقنوات" },
  { name: "🤖 بوت الرياضة", style: "عاشق للكرة والرياضة، يسولف عن المباريات بحماس دون اختلاق نتائج" },
  { name: "🤖 بوت السوالف", style: "بدوي خفيف الدم يحب المسلسلات البدوية والقصص والأمثال" },
] as const;

const input = z.object({ body: z.string().trim().min(1).max(300), author: z.string().max(30).optional() });

export const botReply = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false };
    const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `أنت ${bot.name} في دردشة عامة لموقع المغني لايف. شخصيتك: ${bot.style}. رد بجملة أو جملتين قصيرتين باللهجة الخليجية، بلطف، بدون روابط وبدون اختلاق أخبار أو نتائج. لا تتظاهر بأنك إنسان.` },
          { role: "user", content: `${data.author || "زائر"}: ${data.body}` },
        ],
      }),
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim().slice(0, 300);
    if (!text) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("chat_messages").insert({ body: text, display_name: bot.name, user_id: null });
    return { ok: !error };
  });
