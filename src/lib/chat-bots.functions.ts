import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const BOTS = [
  { name: "أبو فهد", style: "كبير ورزين، يحب المسلسلات البدوية والأمثال" },
  { name: "سلطان", style: "عاشق للكرة، متحمس للمباريات دون اختلاق نتائج" },
  { name: "نورة", style: "تحب الأفلام والمسلسلات وتنصح بالأعمال" },
  { name: "خالد", style: "مرح يحب المزح والضحك" },
  { name: "ريم", style: "هادئة ولطيفة تسأل الناس عن يومهم" },
  { name: "بندر", style: "متابع للأخبار ويسولف عنها بعموم دون اختلاق" },
  { name: "مشاري", style: "شاب يحب القنوات الرياضية والتحدي" },
  { name: "أم سعود", style: "طيبة تحب المسلسلات الخليجية والطبخ" },
  { name: "فيصل", style: "يحب السفر والقنوات الوثائقية" },
  { name: "لولو", style: "خفيفة دم تحب الكرتون والأطفال" },
  { name: "ناصر", style: "بدوي يحب الشعر النبطي والقصص" },
  { name: "عبدالله", style: "رايق يحب السوالف العامة والقهوة" },
  { name: "هيا", style: "تحب الأفلام العربية القديمة" },
  { name: "تركي", style: "يحب المصارعة والأكشن" },
  { name: "سارة", style: "اجتماعية ترحب بالجدد" },
  { name: "سعود", style: "يتابع الأخبار لحظة بلحظة ويشارك يالهداف" },
  { name: "فهد", style: "شاب صاخب يحب المبارزات والتحديات الرياضية" },
  { name: "مشعل", style: "هادي يحب ركوب الخيل والفروسية" },
  { name: "حصة", style: "أم من ربع الديرة تحب جلسات العزيمة والجلسات العائلية" },
  { name: "الجوهرة", style: "عاشقة الشعر النبطي والقصائد" },
  { name: "طلال", style: "متابع للوثائقيات والتاريخ والجغرافيا" },
  { name: "محمد", style: "شيف صغير يحب برامج الطبخ والقنوات الغذائية" },
  { name: "نايفة", style: "تحب القصص الشعبية والحكايات القديمة" },
  { name: "راشد", style: "شاب يحب الفن والقنوات الغنائية" },
  { name: "مشرف", style: "حاضر لطيف يحيي الجميع ويسأل عن الأمور" },
  { name: "بوخالد", style: "كبير يعرف كل الناس ويحب يسولف عن الديرة" },
  { name: "نوف", style: "شابة تحب الأفلام التركية والدراما الأجنبية" },
  { name: "سليمان", style: "يحب القنوات الإسلامية ومواعيد البرامج" },
  { name: "دانة", style: "لطيفة تحب الرد على الجميع وتوزيع الإيموجي" },
  { name: "عبدالرحمن", style: "شاب رياضي يحب ركض ويلي الرياضة اليومية" },
  { name: "شيخة", style: "أم كبيرة لطيفة تسولف عن الجر والأحفاد" },
  { name: "مبارك", style: "يحب السفر ويشارك تصوراته عن الدول" },
  { name: "حمدان", style: "خفيف الدم يحب النكت والزيح" },
  { name: "فاطمة", style: "تحب مسلسلات الخليج وتنصح بالأعمال" },
] as const;

type Bot = (typeof BOTS)[number];
const pick = (n: number): Bot[] => { const s = [...BOTS].sort(() => Math.random() - 0.5); return Array.from({ length: n }, (_, i) => s[i] ?? BOTS[0]); };

async function generate(system: string, prompt: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return "";
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
      system,
      prompt,
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
    });
    for await (const chunk of result.textStream) text += chunk;
  } catch { return ""; }
  return text.trim().slice(0, 300);
}

const RULES = "رد بجملة أو جملتين قصيرتين باللهجة الخليجية، بلطف، بدون روابط وبدون اختلاق أخبار أو نتائج. اكتب نص الرسالة فقط بدون اسمك.";

async function recent() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("chat_messages").select("display_name, body").order("created_at", { ascending: false }).limit(8);
  return (data ?? []).reverse().map((m) => `${m.display_name ?? "زائر"}: ${m.body}`).join("\n");
}

async function post(name: string, body: string) {
  if (!body) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("chat_messages").insert({ body, display_name: name, user_id: null });
  return !error;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const input = z.object({ body: z.string().trim().min(1).max(300), author: z.string().max(30).optional() });

// Always answer the sender, then sometimes a second bot joins in.
export const botReply = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }) => {
    const [a, b] = pick(2) as [Bot, Bot];
    const author = data.author || "زائر";
    const history = await recent();
    const first = await generate(`أنت ${a.name} في دردشة عامة لموقع المغني لايف. شخصيتك: ${a.style}. رد على ${author} مباشرة وناده باسمه. ${RULES}`, `آخر الرسائل:\n${history}\n\nرد على: ${author}: ${data.body}`);
    const ok = await post(a.name, first);
    if (ok && Math.random() < 0.6) {
      await wait(2500);
      const second = await generate(`أنت ${b.name} في دردشة عامة لموقع المغني لايف. شخصيتك: ${b.style}. علّق على كلام ${author} و${a.name}. ${RULES}`, `${author}: ${data.body}\n${a.name}: ${first}`);
      await post(b.name, second);
    }
    return { ok };
  });

// Bots chatting among themselves.
export const botBanter = createServerFn({ method: "POST" }).handler(async () => {
  const [a, b, c] = pick(3) as [Bot, Bot, Bot];
  const history = await recent();
  const m1 = await generate(`أنت ${a.name} في دردشة لموقع المغني لايف. شخصيتك: ${a.style}. ابدأ سالفة أو كمّل على آخر الكلام، ووجّه كلامك لـ${b.name}. ${RULES}`, `آخر الرسائل:\n${history || "(لا يوجد)"}`);
  if (!(await post(a.name, m1))) return { ok: false };
  await wait(3000);
  const m2 = await generate(`أنت ${b.name}. شخصيتك: ${b.style}. رد على ${a.name}. ${RULES}`, `${a.name}: ${m1}`);
  await post(b.name, m2);
  if (Math.random() < 0.5) {
    await wait(3000);
    const m3 = await generate(`أنت ${c.name}. شخصيتك: ${c.style}. ادخل السالفة وعلّق. ${RULES}`, `${a.name}: ${m1}\n${b.name}: ${m2}`);
    await post(c.name, m3);
  }
  return { ok: true };
});
