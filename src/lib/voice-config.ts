// Owner-editable voice-chat settings stored in site_settings("voice_chat"); defaults below are the fallback.
export const VOICE_LIST: { id: string; female: boolean; label: string }[] = [
  ["Puck", 0, "مرح"], ["Charon", 0, "رزين"], ["Fenrir", 0, "حماسي"], ["Orus", 0, "ثابت"], ["Enceladus", 0, "هادئ"], ["Iapetus", 0, "واضح"],
  ["Umbriel", 0, "مريح"], ["Algieba", 0, "ناعم"], ["Algenib", 0, "خشن"], ["Rasalgethi", 0, "مثقف"], ["Alnilam", 0, "قوي"], ["Schedar", 0, "متزن"],
  ["Achird", 0, "ودود"], ["Zubenelgenubi", 0, "عفوي"], ["Sadachbia", 0, "حيوي"], ["Sadaltager", 0, "عارف"],
  ["Kore", 1, "ثابتة"], ["Aoede", 1, "منعشة"], ["Leda", 1, "شابة"], ["Zephyr", 1, "مشرقة"], ["Despina", 1, "ناعمة"], ["Sulafat", 1, "دافئة"],
  ["Callirrhoe", 1, "هادئة"], ["Autonoe", 1, "مشرقة"], ["Erinome", 1, "واضحة"], ["Laomedeia", 1, "مرحة"], ["Achernar", 1, "رقيقة"],
  ["Gacrux", 1, "ناضجة"], ["Pulcherrima", 1, "واثقة"], ["Vindemiatrix", 1, "لطيفة"],
].map(([id, f, label]) => ({ id: id as string, female: f === 1, label: label as string }));

export type VoiceChatConfig = {
  enabled: boolean;
  turnSeconds: number;
  maleVoices: string[];
  femaleVoices: string[];
  botVoices: Record<string, string>;
  openers: string[];
  recordings: { song: string; poem: string };
  clips: { id: string; name: string; path: string; enabled: boolean }[];
  /** One-off line the owner asks a bot to say immediately; served once per listener for 10 minutes. */
  say: { id: string; name: string; text: string; at: number } | null;
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
    say: o.say && typeof o.say.id === "string" && typeof o.say.text === "string" && o.say.text.trim() ? { id: o.say.id.slice(0, 80), name: String(o.say.name ?? "").slice(0, 40), text: o.say.text.trim().slice(0, 400), at: Number(o.say.at) || 0 } : null,
    openers: openers.length ? openers : defaultVoiceChat.openers,
  };
}
