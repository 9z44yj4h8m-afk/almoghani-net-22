import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type XtreamChannel = { id: number; name: string; logo: string; group: string; src: string };

// Logs into the visitor's own Xtream subscription and returns signed relay URLs for its live channels.
// URLs are only signed after the provider confirms the credentials, so the relay never opens to arbitrary hosts.
export const xtreamLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      host: z.string().trim().min(4).max(200),
      username: z.string().trim().min(1).max(100),
      password: z.string().trim().min(1).max(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { fetchableUrl, relayUrl } = await import("@/lib/iptv/relay-sign.server");
    let base: URL;
    try {
      base = new URL(/^https?:\/\//i.test(data.host) ? data.host : `http://${data.host}`);
    } catch {
      return { ok: false as const, error: "رابط السيرفر غير صحيح" };
    }
    const origin = base.origin;
    const q = `username=${encodeURIComponent(data.username)}&password=${encodeURIComponent(data.password)}`;
    const get = async (path: string) => {
      const r = await fetch(fetchableUrl(new URL(`${origin}${path}`)), { headers: { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20" } });
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    };
    try {
      const info = await get(`/player_api.php?${q}`);
      if (!info?.user_info || Number(info.user_info.auth) !== 1) return { ok: false as const, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
      const [cats, streams] = await Promise.all([
        get(`/player_api.php?${q}&action=get_live_categories`),
        get(`/player_api.php?${q}&action=get_live_streams`),
      ]);
      const catName = new Map<string, string>((Array.isArray(cats) ? cats : []).map((c: { category_id: string; category_name: string }) => [String(c.category_id), c.category_name]));
      const channels: XtreamChannel[] = (Array.isArray(streams) ? streams : []).slice(0, 8000).map((s: { stream_id: number; name: string; stream_icon?: string; category_id?: string }) => ({
        id: Number(s.stream_id),
        name: String(s.name ?? ""),
        logo: String(s.stream_icon ?? ""),
        group: catName.get(String(s.category_id)) ?? "أخرى",
        src: relayUrl(`${origin}/live/${encodeURIComponent(data.username)}/${encodeURIComponent(data.password)}/${s.stream_id}.m3u8`),
      }));
      return { ok: true as const, expires: info.user_info.exp_date ? Number(info.user_info.exp_date) : null, channels };
    } catch {
      return { ok: false as const, error: "تعذّر الاتصال بالسيرفر، تأكد من الرابط" };
    }
  });
