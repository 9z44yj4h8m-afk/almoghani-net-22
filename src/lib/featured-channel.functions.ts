import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { featuredChannels } from "./featured-channels";

const ALIASES: Record<string, string[]> = {
  "abu-dhabi-sports": ["abudhabi", "أبوظبي", "ابوظبي"],
  alkass: ["alkass", "الكاس", "الكأس"],
  shahid: ["shahid", "شاهد"],
};
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export const getFeaturedChannels = createServerFn({ method: "GET" }).handler(async () => {
  const { loadKind } = await import("./iptv/library.server");
  const rowsByKind: Record<string, string[][]> = {};
  const items: Array<(typeof featuredChannels)[number] & { logo: string; available: boolean }> = [];
  for (const channel of featuredChannels) {
    if (!rowsByKind[channel.kind]) rowsByKind[channel.kind] = await loadKind(channel.kind);
    const terms = ALIASES[channel.id] ?? [channel.query];
    const row = rowsByKind[channel.kind].find((entry) =>
      terms.some((term) => normalize(channel.kind === "live" ? entry[0] : entry[1]).includes(normalize(term))),
    );
    items.push({ ...channel, logo: row?.[2]?.startsWith("https://") ? row[2] : "", available: !!row });
  }
  return items;
});

export const getFeaturedChannel = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().max(80) }).parse(data))
  .handler(async ({ data }) => {
    const channel = featuredChannels.find((entry) => entry.id === data.id);
    if (!channel) return null;
    const { loadKind } = await import("./iptv/library.server");
    const rows = await loadKind(channel.kind);
    const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const aliases: Record<string, string[]> = { "abu-dhabi-sports": ["abudhabi", "أبوظبي", "ابوظبي"], alkass: ["alkass", "الكاس", "الكأس"], shahid: ["shahid", "شاهد"] };
    const terms = aliases[channel.id] ?? [channel.query];
    const row = rows.find((entry) => terms.some((term) => normalize(channel.kind === "live" ? entry[0] : entry[1]).includes(normalize(term))));
    return { ...channel, logo: row?.[2]?.startsWith("https://") ? row[2] : "", group: row?.[1] ?? "", available: !!row };
  });