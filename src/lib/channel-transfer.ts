/** Manual channel import/export. Never imports credentials or changes existing rows. */
import { channelCategories } from "@/lib/site-config";

export type TransferChannel = {
  name: string;
  category: string;
  url: string;
  logo: string;
};

export const CHANNEL_BACKUP_FORMAT = "ALMOGHANI_LIVE_CHANNELS_V1";

export function validChannelUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && !!parsed.hostname;
  } catch {
    return false;
  }
}

export function normalizeChannelCategory(group: string): string {
  const raw = group.trim();
  if (channelCategories.some((category) => category === raw)) return raw;
  const lower = raw.toLocaleLowerCase();
  if (/رياضي|sports?|bein|بي ?إن|كرة|football/.test(lower)) return "رياضية";
  if (/إخباري|أخبار|news|عاجل/.test(lower)) return "إخبارية";
  if (/اسلام|إسلام|قرآن|سنة|دينية|quran|islam|religio/.test(lower)) return "إسلامية";
  if (/اطفال|أطفال|وثائق|kids|document/.test(lower)) return "أطفال ووثائقي";
  if (/افلام كاملة|أفلام كاملة|full.movie/.test(lower)) return "أفلام كاملة";
  if (/دراما|مسلسل|فيلم|أفلام|movies?|series|cinema/.test(lower)) return "مسلسلات وأفلام";
  return "عامة";
}

const attr = (line: string, field: string): string =>
  line.match(new RegExp('(?:^|\\s)' + field + '="([^"]*)"', "i"))?.[1]?.trim() ?? "";

export function parseChannelM3u(input: string): TransferChannel[] {
  const text = input.replace(/^\uFEFF/, "");
  if (!/^\s*#EXTM3U/i.test(text)) throw new Error("الملف ليس قائمة M3U صالحة.");
  if (/^#EXT-X-(?:TARGETDURATION|MEDIA-SEQUENCE|STREAM-INF|KEY|MAP|VERSION)/m.test(text)) {
    throw new Error("هذا ملف بث HLS لقناة واحدة، وليس قائمة قنوات. استخدم إضافة قناة.");
  }
  const result: TransferChannel[] = [];
  const seen = new Set<string>();
  let pending: { name: string; category: string; logo: string } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF")) {
      const comma = line.lastIndexOf(",");
      const name = (comma >= 0 ? line.slice(comma + 1).trim() : "") || attr(line, "tvg-name") || "قناة";
      pending = {
        name: name.slice(0, 80),
        category: normalizeChannelCategory(attr(line, "group-title")),
        logo: attr(line, "tvg-logo"),
      };
    } else if (pending && validChannelUrl(line)) {
      const url = line.slice(0, 1000);
      const dedup = url.trim().toLowerCase();
      if (!seen.has(dedup)) {
        result.push({ ...pending, url, logo: /^https:\/\//i.test(pending.logo) ? pending.logo.slice(0, 1000) : "" });
        seen.add(dedup);
      }
      pending = null;
    }
  }
  if (!result.length) throw new Error("لم تُعثر على قنوات وروابط صحيحة داخل الملف.");
  return result;
}

export function parseChannelBackup(text: string): TransferChannel[] {
  const payload: unknown = JSON.parse(text.replace(/^\uFEFF/, ""));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("نسخة JSON غير صالحة.");
  const data = payload as { format?: string; channels?: unknown };
  if (data.format !== CHANNEL_BACKUP_FORMAT || !Array.isArray(data.channels)) throw new Error("نسخة JSON ليست من لوحة ALMOGHANI LIVE.");
  const out: TransferChannel[] = [];
  const seen = new Set<string>();
  for (const item of data.channels) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const c = item as Record<string, unknown>;
    const name = typeof c.name === "string" ? c.name.trim().slice(0, 80) : "";
    const url = typeof c.url === "string" ? c.url.trim().slice(0, 1000) : "";
    if (!name || !validChannelUrl(url) || seen.has(url.toLowerCase())) continue;
    seen.add(url.toLowerCase());
    out.push({
      name,
      category: normalizeChannelCategory(typeof c.category === "string" ? c.category : ""),
      url,
      logo: typeof c.logo === "string" && /^https:\/\//i.test(c.logo) ? c.logo.slice(0, 1000) : "",
    });
  }
  if (!out.length) throw new Error("النسخة لا تحتوي أي قناة صالحة.");
  return out;
}

export function serializeChannelM3u(channels: TransferChannel[]): string {
  const esc = (v: string) => v.replace(/["\r\n]/g, " ").trim();
  return ["#EXTM3U", ...channels.filter(c => validChannelUrl(c.url)).flatMap((c) => [
    '#EXTINF:-1 tvg-name="' + esc(c.name) + '" tvg-logo="' + esc(c.logo) + '" group-title="' + esc(c.category) + '",' + esc(c.name),
    c.url,
  ])].join("\n") + "\n";
}
