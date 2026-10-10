// Owner-editable voice-chat settings stored in site_settings("voice_chat"); defaults below are the fallback.
const femaleVoiceNames: Record<string, string> = {
  Despina: "دلال", Sulafat: "شوق", Achernar: "سديم", Callirrhoe: "نجد", Vindemiatrix: "ليلى", Leda: "موضي",
  Kore: "نورة", Aoede: "هيا", Zephyr: "ريم", Autonoe: "نوف", Erinome: "سارة", Laomedeia: "دانة", Gacrux: "الجوهرة", Pulcherrima: "أمل",
};
export const VOICE_LIST: { id: string; female: boolean; label: string; name: string }[] = [
  ["Puck", 0, "مرح"], ["Charon", 0, "رزين"], ["Fenrir", 0, "حماسي"], ["Orus", 0, "ثابت"], ["Enceladus", 0, "هادئ"], ["Iapetus", 0, "واضح"],
  ["Umbriel", 0, "مريح"], ["Algieba", 0, "ناعم"], ["Algenib", 0, "خشن"], ["Rasalgethi", 0, "مثقف"], ["Alnilam", 0, "قوي"], ["Schedar", 0, "متزن"],
  ["Achird", 0, "ودود"], ["Zubenelgenubi", 0, "عفوي"], ["Sadachbia", 0, "حيوي"], ["Sadaltager", 0, "عارف"],
  ["Kore", 1, "ثابتة"], ["Aoede", 1, "منعشة"], ["Leda", 1, "شابة"], ["Zephyr", 1, "مشرقة"], ["Despina", 1, "ناعمة"], ["Sulafat", 1, "دافئة"],
  ["Callirrhoe", 1, "هادئة"], ["Autonoe", 1, "مشرقة"], ["Erinome", 1, "واضحة"], ["Laomedeia", 1, "مرحة"], ["Achernar", 1, "رقيقة"],
  ["Gacrux", 1, "ناضجة"], ["Pulcherrima", 1, "واثقة"], ["Vindemiatrix", 1, "لطيفة"],
].map(([id, f, label]) => ({ id: id as string, female: f === 1, label: label as string, name: femaleVoiceNames[String(id)] ?? String(id) }));

export function voiceDelivery(voice: string) {
  return VOICE_LIST.some((v) => v.id === voice && v.female)
    ? "قولي الكلام بصوت بنت ناعم وعذب وحنون، بنبرة دافئة لطيفة ومريحة وابتسامة خفيفة، بهدوء طبيعي دون همس مبالغ أو تصنع، بلهجة سعودية نجدية كأهل الرياض والقصيم وبنطق واضح، اقرئي الكلام التالي فقط"
    : "قلها بصوت جميل دافئ وواضح، بلهجة سعودية نجدية أصيلة كأهل الرياض والقصيم، بنطق سعودي عفوي ودود";
}

export type VoiceChatConfig = {
  enabled: boolean;
  turnSeconds: number;
  maleVoices: string[];
  femaleVoices: string[];
  botVoices: Record<string, string>;
  openers: string[];
  recordings: { song: string; poem: string };
  clips: { id: string; name: string; path: string; enabled: boolean }[];
  /** One-off line the owner asks a bot to say immediately; served once per listener for 10 minutes. voice = explicit voice id or "" for auto. */
  say: { id: string; name: string; text: string; at: number; voice: string; sing?: boolean; melody?: string; rhythm?: string } | null;
};

export const defaultVoiceChat: VoiceChatConfig = {
  enabled: true,
  turnSeconds: 20,
  maleVoices: ["Puck", "Charon", "Fenrir", "Orus", "Algenib", "Enceladus"],
  femaleVoices: ["Kore", "Aoede", "Leda", "Zephyr", "Despina", "Sulafat"],
  botVoices: {},
  recordings: { song: "", poem: "" },
  clips: [],
  say: null,
  openers: [
    "هلا والله ومسهلا، نورتوا الغرفة الصوتية، حياكم الله كلكم، وش أخباركم اليوم؟ عساكم بخير وعافية",
    "يا هلا ويا مرحبا بالجميع، الله يمسيكم بالخير، وش رايكم نسولف شوي عن المسلسلات اللي تتابعونها هالأيام؟",
    "مساكم الله بالخير يا جماعة، حياكم في المغني لايف، تفضلوا وخذوا راحتكم والمايك يدور على الكل",
  ],
};

const known = new Set(VOICE_LIST.map((v) => v.id));
export function normalizeVoiceChat(v: unknown): VoiceChatConfig {
  const o = (v ?? {}) as Partial<VoiceChatConfig>;
  const list = (x: unknown, d: string[]) => { const a = Array.isArray(x) ? x.filter((i): i is string => typeof i === "string" && known.has(i)) : []; return a.length ? a : d; };
  const botVoices: Record<string, string> = {};
  for (const [k, val] of Object.entries(o.botVoices ?? {})) if (typeof val === "string" && known.has(val)) botVoices[k] = val;
  const openers = Array.isArray(o.openers) ? o.openers.filter((s): s is string => typeof s === "string" && !!s.trim()).map((s) => s.slice(0, 300)) : [];
  return {
    enabled: o.enabled !== false,
    turnSeconds: Math.min(40, Math.max(8, Number(o.turnSeconds) || 20)),
    maleVoices: list(o.maleVoices, defaultVoiceChat.maleVoices),
    femaleVoices: list(o.femaleVoices, defaultVoiceChat.femaleVoices),
    botVoices,
    clips: Array.isArray(o.clips) ? o.clips.filter((c) => c && typeof c.id === "string" && typeof c.name === "string" && typeof c.path === "string" && /^recordings\/[a-z0-9-]+\.(mp3|wav|m4a|ogg|webm)$/.test(c.path)).slice(0, 100).map((c) => ({ id: c.id.slice(0, 80), name: c.name.trim().slice(0, 40) || "تسجيل", path: c.path, enabled: c.enabled !== false })) : [],
    recordings: {
      song: typeof o.recordings?.song === "string" && /^recordings\/[a-z0-9-]+\.(mp3|wav|m4a|ogg|webm)$/.test(o.recordings.song) ? o.recordings.song : "",
      poem: typeof o.recordings?.poem === "string" && /^recordings\/[a-z0-9-]+\.(mp3|wav|m4a|ogg|webm)$/.test(o.recordings.poem) ? o.recordings.poem : "",
    },
    say: o.say && typeof o.say.id === "string" && typeof o.say.text === "string" && o.say.text.trim() ? { id: o.say.id.slice(0, 80), name: String(o.say.name ?? "").slice(0, 40), text: o.say.text.trim().slice(0, 400), at: Number(o.say.at) || 0, voice: typeof o.say.voice === "string" && known.has(o.say.voice) ? o.say.voice : "", sing: o.say.sing === true, melody: String(o.say.melody ?? "").slice(0, 20), rhythm: String(o.say.rhythm ?? "").slice(0, 20) } : null,
    openers: openers.length ? openers : defaultVoiceChat.openers,
  };
}

export const SING_DELIVERY = "غنيها بصوت ناعم عذب ورقيق جدا، بلحن هادئ حالم وطرب سعودي نجدي أصيل، مدّ الكلمات كأنك تغني";

export const MELODIES = [
  { id: "najdi", label: "لحن نجدي طربي" }, { id: "samri", label: "لحن سامري" }, { id: "khaliji", label: "لحن خليجي رومانسي" },
  { id: "shaila", label: "شيلة حماسية" }, { id: "lullaby", label: "لحن هادي حنون (تهويدة)" },
] as const;
export const RHYTHMS = [
  { id: "slow", label: "إيقاع بطيء حالم" }, { id: "khabeeti", label: "رقصة خبيتي" }, { id: "dahha", label: "رقصة دحّة" },
  { id: "ardha", label: "رقصة عرضة" }, { id: "happy", label: "إيقاع فرح سريع" },
] as const;
export const PRESET_SONGS = [
  { id: "layl", title: "يا ليل الرياض", melody: "khaliji", rhythm: "slow", text: "يا ليل الرياض طوّل سهرنا، والنجم يشهد على حب قلبي، يا ليل لا تروح خلنا، نسهر على صوت الحبيب" },
  { id: "qassim", title: "هلا بأهل القصيم", melody: "najdi", rhythm: "khabeeti", text: "هلا وغلا بأهل القصيم، يا زين طيبهم وكرمهم، هلا بالربع والنخل العظيم، والقلب يفرح بشوفهم" },
  { id: "salam", title: "سلامي للغالي", melody: "samri", rhythm: "dahha", text: "سلامي للغالي عدد المطر، وعدد ما هبّ نسيم السحر، يا اللي غيابك طال واشتقت لك، تعال نورّ ليالي القمر" },
  { id: "watan", title: "يا دارنا", melody: "shaila", rhythm: "ardha", text: "يا دارنا يا عز راسي وفخري، يا ديرة الأمجاد والطيب والجود، نفداك بالروح والعمر يجري، وانتي لنا عز ومجد ممدود" },
  { id: "nam", title: "نام يا حلو", melody: "lullaby", rhythm: "slow", text: "نام يا حلو نام، والقمر يحرسك، نام والليل سلام، والورد يحضنك" },
] as const;
export function singDelivery(melody?: string, rhythm?: string) {
  const m = MELODIES.find((x) => x.id === melody)?.label ?? "لحن نجدي طربي";
  const r = RHYTHMS.find((x) => x.id === rhythm)?.label ?? "إيقاع بطيء حالم";
  return `${SING_DELIVERY}. غنّها كأغنية حقيقية كاملة على ${m} مع ${r}، التزم بنغمة ثابتة وارفع وانزل الصوت مع اللحن، ومدّ آخر كل جملة`;
}

/** Singing prompts fail intermittently upstream; try richer direction first, then simpler ones, then plain speech. */
export async function speakWithFallback(apiKey: string, voice: string, text: string, directions: string[]) {
  let last: Response | null = null;
  for (const d of directions) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-tts-preview",
        contents: [{ role: "user", parts: [{ text: d ? `${d}: ${text}` : text }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        stream_format: "audio",
      }),
    });
    if (res.ok) return res;
    last = res;
  }
  return last!;
}
export const singFallbacks = (melody?: string, rhythm?: string) => [singDelivery(melody, rhythm), "غنيها بصوت بنت ناعم", "غنيها بصوت ناعم", ""];
