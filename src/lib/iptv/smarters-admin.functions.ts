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
  .inputValidator((d) => z.object({ kind, group: z.string().max(300), q: z.string().max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { loadRaw } = await import("./library.server");
    const q = data.q.trim().toLowerCase();
    const rows = (await loadRaw(data.kind)).filter((r) => (!data.group || r[1] === data.group) && (!q || r[0].toLowerCase().includes(q)));
    return { total: rows.length, items: rows.slice(0, 200).map((r) => ({ id: r[3], name: r[0], group: r[1] })) };
  });

const config = z.object({
  groups: z.record(z.string().max(400), z.object({ label: z.string().max(120).optional(), hidden: z.boolean().optional(), order: z.number().int().min(0).max(100000).optional() })),
  items: z.record(z.string().max(60), z.object({ label: z.string().max(200).optional(), hidden: z.boolean().optional() })),
});

export const saveSmartersConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => config.parse(d))
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
    const v = (data?.value ?? {}) as { groups?: Record<string, { label?: string; hidden?: boolean; order?: number }>; items?: Record<string, { label?: string; hidden?: boolean }> };
    return { groups: v.groups ?? {}, items: v.items ?? {} };
  });
