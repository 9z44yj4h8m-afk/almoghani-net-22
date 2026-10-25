import type { Channel, ChannelCategory } from "./channels";
export const isSmartersChannel = (channel: Channel) => channel.id.startsWith("smarters:");
export function normalizeChannelSearch(value: string): string {
  return value.toLocaleLowerCase().replace(/[\u064B-\u065F\u0670ـ]/g, "").replace(/[أإآ]/g, "ا").replace(/[^\p{L}\p{N}]/gu, "").replace(/بيان|بين/g, "bein").replace(/سبورت|sports/g, "sport");
}
export function matchesChannelSearch(name: string, query: string): boolean {
  return normalizeChannelSearch(name).includes(normalizeChannelSearch(query));
}
// Only select a configured member entry; XTRA and public lookalikes are not match substitutes.
export function findHomepageBeinChannel(channels: Channel[]): Channel | undefined {
  return channels.find(channel => isSmartersChannel(channel) && channel.category === "رياضية" && /^bein[^\d]*1(?!\d)/.test(normalizeChannelSearch(channel.name).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))) && !/english|french|france|turk|spanish|إنجليزي|انجليزي|فرنسي/i.test(`${channel.name} ${channel.description}`));
}
export function groupBeinChannels(channels: Channel[]): { id: string; name: string; channels: Channel[]; grouped: boolean }[] {
  const groups: { id: string; name: string; channels: Channel[]; grouped: boolean }[] = [];
  const byNumber = new Map<string, typeof groups[number]>();
  for (const channel of channels) {
    const normalized = normalizeChannelSearch(channel.name).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    const number = normalized.match(/bein[^\d]*(\d{1,2})(?!\d)/)?.[1];
    if (channel.category !== "رياضية" || !number) { groups.push({ id: channel.id, name: channel.name, channels: [channel], grouped: false }); continue; }
    const key = String(Number(number));
    const existing = byNumber.get(key);
    if (existing) existing.channels.push(channel);
    else {
      const group = { id: `bein-group:${key}`, name: `بي إن سبورت ${key}`, channels: [channel], grouped: true };
      byNumber.set(key, group); groups.push(group);
    }
  }
  return groups;
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
  const all = [...merged, ...memberChannels.filter(channel => !used.has(channel.id))];
  const sports = all.filter(channel => channel.category === "رياضية");
  const rank = (channel: Channel) => {
    if (!normalizeChannelSearch(channel.name).includes("bein")) return 2;
    return /english|eng\b|france|french|fr\b|turk|spain|spanish|إنجليزي|انجليزي|فرنسي/i.test(`${channel.name} ${channel.description}`) ? 1 : 0;
  };
  const number = (channel: Channel) => {
    const digits = channel.name.replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    return Number(digits.match(/\d+/)?.[0] ?? 1000);
  };
  sports.sort((a, b) => rank(a) - rank(b) || (rank(a) < 2 ? number(a) - number(b) : 0));
  let index = 0;
  return all.map(channel => channel.category === "رياضية" ? sports[index++] ?? channel : channel);
}