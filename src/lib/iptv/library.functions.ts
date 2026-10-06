import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PRIVATE_PIN } from "../private-movies.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kind = z.enum(["live", "movie", "series"]);
const pin = z.string().max(200);
async function check(p: string) {
  if (p === PRIVATE_PIN) return;
  throw new Error("رقم سري خاطئ");
}

const requireLibraryAccess = requireSupabaseAuth;

export const getLibraryGroups = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) => z.object({ pin, kind }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("الجلسة مقفلة؛ أدخل رمز المكتبة.");
    const { groupsOf } = await import("./library.server");
    return groupsOf(data.kind);
  });

export const getLibraryTitles = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) =>
    z.object({ pin, kind: z.enum(["live", "series"]), q: z.string().max(100), page: z.number().int().min(0).max(5000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("الجلسة مقفلة؛ أدخل رمز المكتبة.");
    const { titles } = await import("./library.server");
    return titles(data.kind, data.q, data.page);
  });

export const searchLibrary = createServerFn({ method: "POST" })
  .middleware([requireLibraryAccess])
  .inputValidator((d) =>
    z
      .object({ pin, kind, q: z.string().max(100), group: z.string().max(200), page: z.number().int().min(0).max(5000) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("member_library_sessions").select("unlocked").maybeSingle();
    if (error || !session?.unlocked) throw new Error("الجلسة مقفلة؛ أدخل رمز المكتبة.");
    const { search } = await import("./library.server");
    return search(data.kind, data.q, data.group, data.page);
  });
