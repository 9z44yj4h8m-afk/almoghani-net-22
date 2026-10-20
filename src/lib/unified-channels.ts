import type { Channel, ChannelCategory } from "./channels";
export const isSmartersChannel = (channel: Channel) => channel.id.startsWith("smarters:");
export function normalizeChannelSearch(value: string): string {
  return value.toLocaleLowerCase().replace(/[\u064B-\u065F\u0670ـ]/g, "").replace(/[أإآ]/g, "ا").replace(/[^\p{L}\p{N}]/gu, "").replace(/بيان|بينسبورت|بيناسبور|بين/g, "bein");
}
export function matchesChannelSearch(name: string, query: string): boolean {
  return normalizeChannelSearch(name).includes(normalizeChannelSearch(query));
}
export function smartersCategory(group: string): ChannelCategory {
  if (/news|أخبار|إخبار|اخبار/i.test(group)) return "إخبارية";
  if (/sport|bein|ssc|رياض/i.test(group)) return "رياضية";
  if (/islam|quran|قرآن|اسلام|إسلام/i.test(group)) return "إسلامية";
  if (/kid|child|document|أطفال|وثائق/i.test(group)) return "أطفال ووثائقي";
  if (/movie|cinema|أفلام|افلام|سينما/i.test(group)) return "أفلام كاملة";
  if (/series|drama|مسلسل|دراما/i.test(group)) return "مسلسلات وأفلام";
  return "عامة";
}
export function mergeLiveChannels(publicChannels: Channel[], memberChannels: Channel[]): Channel[] {
  const queues = new Map<ChannelCategory, Channel[]>();
  for (const channel of memberChannels) {
    const queue = queues.get(channel.category) ?? [];
    queue.push(channel); queues.set(channel.category, queue);
  }
  const merged: Channel[] = [];
  for (const channel of publicChannels) {
    merged.push(channel);
    const next = queues.get(channel.category)?.shift();
    if (next) merged.push(next);
  }
  const used = new Set(merged.map(channel => channel.id));
  return [...merged, ...memberChannels.filter(channel => !used.has(channel.id))];
}