import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const configureOwnerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!data) throw new Error("Forbidden");
    const password = process.env['ADMIN_INITIAL_PASSWORD'];
    if (!password) throw new Error("Password configuration unavailable");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password });
    if (error) throw new Error(`Unable to configure password: ${error.code ?? error.status}`);
    return { ok: true };
  });

export const loginOwner = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string().min(1).max(128) }).parse(data))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error("تعذّر الدخول حاليًا.");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: auth, error } = await client.auth.signInWithPassword({ email: "a0552525337@gmail.com", password: data.password });
    if (error || !auth.session) return { ok: false as const };
    const { data: admin, error: roleError } = await client.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
    if (roleError || !admin) { await client.auth.signOut(); return { ok: false as const }; }
    return { ok: true as const, access_token: auth.session.access_token, refresh_token: auth.session.refresh_token };
  });