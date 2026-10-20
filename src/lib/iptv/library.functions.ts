import { genreSchema } from "./smarters-config";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kind = z.enum(["live", "movie", "series"]);
const pin = z.string().max(200);
const requireLibraryAccess = requireSupabaseAuth;

export const getUnifiedVodCatalog = createServerFn({ method: "GET" })
  .inputValidator(data => z.object({ kind: z.enum(["movie", "series"]), q: z.string().max(100), page: z.number().int().min(0).max(5000), lang: z.enum(["عربي", "عالمي"]).optional() }).parse(data))
  .handler(async ({ data }) => {
    const { vodCatalogRows } = await import("./vod-catalog.server");
    const { matchesChannelSearch } = await import("../unified-channels");
    const rows = (await vodCatalogRows(data.kind)).filter(({ row }) => {
      const arabic = /arab|عرب/i.test(row[1]) || /[\u0600-\u06ff]/.test(row[0]);
      return (!data.lang || (data.lang === "عربي" ? arabic : !arabic)) && (!data.q || matchesChannelSearch(row[0], data.q));
    });
    return { total: rows.length, items: rows.slice(data.page * 60, (data.page + 1) * 60).map(({ id, row }) => ({ id, title: row[0] })) };
  });

export const resolveUnifiedVod = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator(data => z.object({ kind: z.enum(["movie", "series"]), id: z.string().regex(/^vod:[a-f0-9]{64}$/) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("تعذّر التحقق من جلسة العضو.");
    const { vodCatalogRows } = await import("./vod-catalog.server");
    const match = (await vodCatalogRows(data.kind)).find(item => item.id === data.id);
    if (!match) throw new Error("المحتوى غير متاح حاليًا.");
    const { streamUrl, search } = await import("./library.server");
    if (data.kind === "movie") return { items: [{ name: match.row[0], url: streamUrl("movie", match.row[3], match.row[4]) }] };
    return { items: (await search("series", "", match.row[0], 0)).items.map(item => ({ name: item.name, url: item.url })) };
  });

export const getUnifiedLiveCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { liveCatalogRows } = await import("./live-catalog.server");
  return (await liveCatalogRows()).map(({ id, row }) => ({ id, name: row[0], group: row[1] }));
});
export const resolveUnifiedLiveChannel = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((data) => z.object({ id: z.string().regex(/^smarters:[a-f0-9]{64}$/) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("تعذّر التحقق من جلسة العضو.");
    const { liveCatalogRows } = await import("./live-catalog.server");
    const match = (await liveCatalogRows()).find(item => item.id === data.id);
    if (!match) throw new Error("القناة غير متاحة حاليًا.");
    const { streamUrl } = await import("./library.server");
    return { url: streamUrl("live", match.row[3], match.row[4]) };
  });

// Public metadata only; never use search(), which resolves credential-bearing URLs.
export const browseSmartersChannels = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().max(100), group: z.string().max(200), page: z.number().int().min(0).max(5000) }).parse(d))
  .handler(async ({ data }) => {
    const { loadKind } = await import("./library.server");
    const rows = await loadKind("live");
    const q = data.q.trim().toLowerCase();
    const hits = rows.filter((row) => (!data.group || row[1] === data.group) && (!q || `${row[0]} ${row[1]}`.toLowerCase().includes(q)));
    return {
      groups: [...new Set(rows.map((row) => row[1]))],
      total: hits.length,
      items: hits.slice(data.page * 60, (data.page + 1) * 60).map((row) => ({ name: row[0], group: row[1] })),
    };
  });

export const getLibraryGroups = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) => z.object({ pin, kind }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("تعذّر التحقق من جلسة العضو.");
    const { groupsOf } = await import("./library.server");
    return groupsOf(data.kind);
  });

export const getLibraryTitles = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) =>
    z.object({ pin, kind: z.enum(["live", "series"]), q: z.string().max(100), page: z.number().int().min(0).max(5000), genre: genreSchema.optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("تعذّر التحقق من جلسة العضو.");
    const { titles } = await import("./library.server");
    return titles(data.kind, data.q, data.page, data.genre);
  });

export const searchLibrary = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) =>
    z
      .object({ pin, kind, q: z.string().max(100), group: z.string().max(200), page: z.number().int().min(0).max(5000), genre: genreSchema.optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("تعذّر التحقق من جلسة العضو.");
    const { search } = await import("./library.server");
    return search(data.kind, data.q, data.group, data.page, data.genre);
  });

export const getLibraryGenres = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) => z.object({ kind: z.enum(["movie", "series"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("تعذّر التحقق من جلسة العضو.");
    const { genresOf } = await import("./library.server");
    return genresOf(data.kind);
  });
