import type { Channel } from "./channels";
import { parseChannelM3u } from "./channel-transfer";
import { matchesChannelSearch } from "./unified-channels";

export type AtlasChannel = Channel & { country?: string; kind?: "tv" | "radio" };
export function isSaudiChannel(channel: AtlasChannel) {
  return channel.country === "SA" || /السعود|saudi|\bSBC\b|\bSSC\b|\bMBC\b|روتانا|rotana|الوسام|الصحراء|أصيل|اصيل|الخزامى|ذكريات|القرآن الكريم|السنة النبوية|الحرم|الإخبارية/i.test(`${channel.name} ${channel.description} ${channel.id}`);
}
export function channelKind(channel: AtlasChannel) {
  return channel.kind ?? (/radio|راديو|إذاعة|اذاعة|\bfm\b|خزامى|loud/i.test(`${channel.name} ${channel.streamUrl ?? ""}`) ? "radio" : "tv");
}
export function filterAtlasChannels(channels: AtlasChannel[], query: string, country: string, kind: string, category: string) {
  return channels.filter(channel => (country === "all" || isSaudiChannel(channel)) && (kind === "all" || channelKind(channel) === kind) && (category === "all" || category === channel.category) && matchesChannelSearch(channel.name, query));
}
export function importAtlasPlaylist(text: string, batch: string): AtlasChannel[] {
  return parseChannelM3u(text).map((channel, index) => ({
    id: `local:${batch}:${index}`, name: channel.name, category: channel.category as Channel["category"],
    streamUrl: channel.url, thumbnail: channel.logo, description: "ملف محلي",
  }));
}
export function appendAtlasChannels(existing: AtlasChannel[], imported: AtlasChannel[]) {
  const urls = new Set(existing.map(channel => channel.streamUrl).filter(Boolean));
  return [...existing, ...imported.filter(channel => !urls.has(channel.streamUrl))];
}