import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profiles, error } = await context.supabase.from("profiles").select("user_id,display_name,last_login_at,created_at,suspended").order("created_at", { ascending: false });
    if (error) throw error;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emails = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return (profiles ?? []).map((p) => ({ ...p, email: emails.get(p.user_id) ?? "" }));
  });

/** Verifies a stream link responds before the owner saves it. */
export const checkStreamUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url().max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const url = data.url;
    const yt = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/)?.[1];
    try {
      if (yt) {
        const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt}`)}`);
        return r.ok ? { ok: true as const, kind: "youtube" as const } : { ok: false as const, reason: "فيديو يوتيوب غير متاح أو يمنع التشغيل في المواقع." };
      }
      if (!url.startsWith("https://")) return { ok: false as const, reason: "الرابط يجب أن يبدأ بـ https حتى يعمل داخل الموقع." };
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = r.ok ? (await r.text()).slice(0, 2000) : "";
      if (!r.ok) return { ok: false as const, reason: `الرابط لا يستجيب (رمز ${r.status}).` };
      if (!text.includes("#EXTM3U")) return { ok: false as const, reason: "الرابط لا يحتوي بث HLS صالح (m3u8)." };
      return { ok: true as const, kind: "hls" as const };
    } catch {
      return { ok: false as const, reason: "تعذّر الوصول إلى الرابط." };
    }
  });
