export const chatSizes = [
  { key: "height", label: "ارتفاع الرسائل", min: 280, max: 800, fallback: 440 },
  { key: "fontSize", label: "مقاس خط الرسائل", min: 12, max: 24, fallback: 15 },
  { key: "avatarSize", label: "مقاس صور الأسماء", min: 24, max: 60, fallback: 37 },
  { key: "iconSize", label: "مقاس أيقونات الأزرار", min: 16, max: 36, fallback: 20 },
  { key: "sidebarWidth", label: "عرض قائمة الأسماء", min: 110, max: 320, fallback: 270 },
  { key: "radius", label: "استدارة الزوايا", min: 0, max: 20, fallback: 4 },
] as const;
export const chatColors = [
  { key: "paper", label: "خلفية الرسائل", fallback: "#fafafa" },
  { key: "ink", label: "نص الرسائل", fallback: "#202020" },
  { key: "steel", label: "الإطار والأزرار", fallback: "#29313d" },
  { key: "edge", label: "حدود الشات", fallback: "#606977" },
  { key: "name", label: "لون الاسم", fallback: "#353c8b" },
] as const;
export const chatIconChoices = ["default", "🌹", "😊", "💬", "⭐", "❤️", "👑", "⚽", "🎬", "✨"] as const;
export const requestedChatEmojis = ["😎", "👍🏻", "🌺", "💃🏻", "🙈", "🤣", "😳", "😘", "😩", "😭", "😂", "😴", "😍", "😔", "☎️", "😡", "📍", "👯", "✌🏻", "😝", "🤓", "😱", "😓", "👄", "💋", "👁️", "👩🏼‍🍳", "🧑🏼‍🎤", "🙆🏼‍♀️"];
export type ChatAppearance = {
  height: number; fontSize: number; avatarSize: number; iconSize: number; sidebarWidth: number; radius: number;
  paper: string; ink: string; steel: string; edge: string; name: string;
  showRoses: boolean; showSidebar: boolean; showAvatars: boolean;
  sendIcon: string; smileIcon: string; avatarIcon: string; emojis: string[];
};
export const defaultChatAppearance: ChatAppearance = {
  height: 440, fontSize: 15, avatarSize: 37, iconSize: 20, sidebarWidth: 270, radius: 4,
  paper: "#fafafa", ink: "#202020", steel: "#29313d", edge: "#606977", name: "#353c8b",
  showRoses: true, showSidebar: true, showAvatars: true,
   sendIcon: "default", smileIcon: "default", avatarIcon: "default", emojis: [...requestedChatEmojis, "😊", "🌹", "👏", "🔥", "💙", "✨"],
};
export function normalizeChatAppearance(raw: Partial<ChatAppearance> = {}): ChatAppearance {
  const c = { ...defaultChatAppearance };
  for (const f of chatSizes) { const n = raw[f.key]; c[f.key] = typeof n === "number" && Number.isFinite(n) ? Math.round(Math.min(f.max, Math.max(f.min, n))) : f.fallback; }
  for (const f of chatColors) { const color = raw[f.key]; c[f.key] = typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : f.fallback; }
  for (const k of ["showRoses", "showSidebar", "showAvatars"] as const) c[k] = typeof raw[k] === "boolean" ? raw[k] : c[k];
  for (const k of ["sendIcon", "smileIcon", "avatarIcon"] as const) { const s = raw[k]; c[k] = typeof s === "string" && s.length <= 16 && !/[<>\\{};]/.test(s) ? s : "default"; }
  c.emojis = Array.isArray(raw.emojis) ? [...new Set(raw.emojis.filter((s) => typeof s === "string" && s.trim() && s.length <= 16 && !/[<>\\{};]/.test(s)))].slice(0, 40) : c.emojis;
  return c;
}