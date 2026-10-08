import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const BOTS = [
  { name: "بوت المغني", style: "مرح وودود، يرحب بالناس ويسولف عن البث والقنوات" },
  { name: "بوت الرياضة", style: "عاشق للكرة والرياضة، يسولف عن المباريات بحماس دون اختلاق نتائج" },
  { name: "بوت السوالف", style: "بدوي خفيف الدم يحب المسلسلات البدوية والقصص والأمثال" },
] as const;

const input = z.object({ body: z.string().trim().min(1).max(300), author: z.string().max(30).optional() });

export const botReply = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false };
    const bot = BOTS[Math.floor(Math.random() * BOTS.length)] ?? BOTS[0];
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const { createLovableAiGatewayRunIdFetch } = await import("@/lib/ai/run-id.server");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: createLovableAiGatewayRunIdFetch().fetch,
    });
    let text = "";
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: `أنت ${bot.name} في دردشة عامة لموقع المغني لايف. شخصيتك: ${bot.style}. رد بجملة أو جملتين قصيرتين باللهجة الخليجية، بلطف، بدون روابط وبدون اختلاق أخبار أو نتائج. لا تتظاهر بأنك إنسان.`,
        prompt: `${data.author || "زائر"}: ${data.body}`,
        providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
      });
      for await (const chunk of result.textStream) text += chunk;
    } catch { return { ok: false }; }
    text = text.trim().slice(0, 300);
    if (!text) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("chat_messages").insert({ body: text, display_name: bot.name, user_id: null });
    return { ok: !error };
  });
