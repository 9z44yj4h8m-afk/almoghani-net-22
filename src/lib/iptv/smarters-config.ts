import { z } from "zod";

export const GENRES = [
  { id: "comedy", label: "كوميديا" },
  { id: "drama", label: "دراما" },
  { id: "action", label: "أكشن" },
] as const;
export type Genre = typeof GENRES[number]["id"];
export type VodKind = "movie" | "series";
export const genreSchema = z.enum(["comedy", "drama", "action"]);
const override = z.object({
  label: z.string().max(200).optional(),
  hidden: z.boolean().optional(),
  order: z.number().int().min(0).max(100000).optional(),
  genre: z.union([genreSchema, z.literal("")]).optional(),
});
export const smartersConfigSchema = z.object({
  groups: z.record(z.string().max(400), override.extend({ label: z.string().max(120).optional() })),
  items: z.record(z.string().max(60), override),
  genreOrders: z.object({ movie: z.array(genreSchema).max(3).optional(), series: z.array(genreSchema).max(3).optional() }).optional(),
});
export type SmartersConfig = z.infer<typeof smartersConfigSchema>;

export function orderedGenres(kind: VodKind, config: SmartersConfig) {
  const ids = [...new Set([...(config.genreOrders?.[kind] ?? []), ...GENRES.map((g) => g.id)])];
  return ids.flatMap((id) => GENRES.filter((g) => g.id === id));
}

export function itemGenre(kind: VodKind, id: number, group: string, config: SmartersConfig): Genre | "" {
  const item = config.items[`${kind}:${id}`];
  if (item?.genre !== undefined) return item.genre;
  const section = config.groups[`${kind}:${group}`];
  if (section?.genre !== undefined) return section.genre;
  const name = `${group} ${section?.label ?? ""}`.toLowerCase();
  if (/comedy|كوميدي|كوميديا/.test(name)) return "comedy";
  if (/action|أكشن|اكشن/.test(name)) return "action";
  if (/drama|دراما/.test(name)) return "drama";
  return "";
}

export function moveGenre(kind: VodKind, config: SmartersConfig, index: number, direction: -1 | 1): SmartersConfig {
  const ids = orderedGenres(kind, config).map((g) => g.id);
  const current = ids[index], other = ids[index + direction];
  if (!current || !other) return config;
  ids[index] = other;
  ids[index + direction] = current;
  return { ...config, genreOrders: { ...config.genreOrders, [kind]: ids } };
}