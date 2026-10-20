import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Relays the private IPTV provider over HTTPS so the in-site player works (provider is HTTP-only).
// Entry URLs must be on the provider host; nested URLs (after redirects) must carry a server signature,
// so this can never act as an open proxy.
const PROVIDER_HOST = "ebh48.top";
const KEY = "almoghani-iptv-relay-313285624258";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" };

const sign = (u: string) => createHmac("sha256", KEY).update(u).digest("hex").slice(0, 32);
const proxied = (u: string) => `/api/public/iptv?u=${encodeURIComponent(u)}&s=${sign(u)}`;

/** Bare IPv4 hosts are rewritten to <ip>.sslip.io (resolves to the same IP) so the edge runtime can fetch them. */
function fetchableUrl(u: URL): string {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return u.toString();
  const copy = new URL(u.toString());
  copy.hostname = `${u.hostname}.sslip.io`;
  return copy.toString();
}

function allowed(target: URL, s: string | null) {
  if (target.protocol !== "http:" && target.protocol !== "https:") return false;
  if (target.hostname === PROVIDER_HOST) return true;
  if (!s) return false;
  const a = Buffer.from(sign(target.toString()));
  const b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/iptv")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        let target: URL;
        try {
          target = new URL(params.get("u") ?? "");
        } catch {
          return new Response("Bad url", { status: 400, headers: CORS });
        }
        if (!allowed(target, params.get("s"))) return new Response("Not allowed", { status: 403, headers: CORS });

        const headers: Record<string, string> = { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20" };
        const range = request.headers.get("range");
        if (range) headers["Range"] = range;
        // Follow redirects manually: the provider redirects to bare-IP stream servers, which the
        // published edge runtime refuses to fetch directly (Cloudflare 1003 → 403).
        let current = target;
        let upstream: Response | null = null;
        for (let hop = 0; hop < 5; hop++) {
          upstream = await fetch(fetchableUrl(current), { headers, redirect: "manual" });
          const loc = upstream.headers.get("location");
          if (upstream.status >= 300 && upstream.status < 400 && loc) {
            current = new URL(loc, current);
            continue;
          }
          break;
        }
        if (!upstream || (!upstream.ok && upstream.status !== 206)) {
          return new Response("Upstream error", { status: upstream?.status ?? 502, headers: CORS });
        }
        const base = current;
        const type = upstream.headers.get("content-type") ?? "";
        const isPlaylist = base.pathname.endsWith(".m3u8") || type.includes("mpegurl");

        if (isPlaylist) {
          const text = await upstream.text();
          const out = text
            .split("\n")
            .map((line) => {
              const t = line.trim();
              if (!t) return line;
              if (t.startsWith("#")) return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${proxied(new URL(u, base).toString())}"`);
              return proxied(new URL(t, base).toString());
            })
            .join("\n");
          return new Response(out, { headers: { ...CORS, "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store" } });
        }

        const h: Record<string, string> = { ...CORS, "content-type": type || "video/mp2t", "accept-ranges": "bytes" };
        for (const k of ["content-length", "content-range"]) {
          const v = upstream.headers.get(k);
          if (v) h[k] = v;
        }
        return new Response(upstream.body, { status: upstream.status, headers: h });
      },
    },
  },
});
