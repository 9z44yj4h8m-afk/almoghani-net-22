import { genreSchema, itemGenre, smartersConfigSchema, type SmartersConfig } from "./smarters-config";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kind = z.enum(["live", "movie", "series"]);

async function assertAdmin(supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/** Raw groups (original names) for the owner, including hidden ones. */
export const adminSmartersGroups = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { loadRaw } = await import("./library.server");
    const rows = await loadRaw(data.kind);
    const m = new Map<string, number>();
    for (const r of rows) m.set(r[1], (m.get(r[1]) ?? 0) + 1);
    return [...m.entries()].map(([name, count]) => ({ name, count }));
  });

/** Raw items for the owner (names only, never stream URLs). */
export const adminSmartersItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind, group: z.string().max(300), q: z.string().max(100), genre: genreSchema.optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { loadRaw, loadConfig } = await import("./library.server");
    const cfg = await loadConfig();
    const q = data.q.trim().toLowerCase();
    const rows = (await loadRaw(data.kind)).filter((r) => (!data.group || r[1] === data.group) && (!q || r[0].toLowerCase().includes(q)) && (!data.genre || (data.kind !== "live" && itemGenre(data.kind, r[3], r[1], cfg) === data.genre)));
    return { total: rows.length, items: rows.slice(0, (data.group || data.genre) && !q ? 2000 : 200).map((r) => ({ id: r[3], name: r[0], group: r[1] })) };
  });

export const saveSmartersConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => smartersConfigSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("site_settings").upsert({ key: "smarters", value: data as never, updated_at: new Date().toISOString() });
    if (error) throw new Error("تعذّر الحفظ.");
    const { clearSmartersConfig } = await import("./library.server");
    clearSmartersConfig();
    return { ok: true };
  });

export const loadSmartersConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("site_settings").select("value").eq("key", "smarters").maybeSingle();
    const v = (data?.value ?? {}) as Partial<SmartersConfig>;
    return { groups: v.groups ?? {}, items: v.items ?? {}, genreOrders: v.genreOrders };

  });
