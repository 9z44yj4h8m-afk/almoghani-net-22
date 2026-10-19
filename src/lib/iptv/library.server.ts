import { itemGenre, orderedGenres, type Genre, type SmartersConfig } from "./smarters-config";
// Private IPTV library (owner's personal subscription). Never import from client code.
export type Kind = "live" | "movie" | "series";
type Row = [name: string, group: string, logo: string, id: number, ext: string];

const HOST = "http://freeiptv.ottc.xyz:80";
const USER = "767910324250";
const PASS = "313285624258";

const cache = new Map<Kind, Promise<Row[]>>();

async function decode(b64: string): Promise<Row[]> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

export function loadRaw(kind: Kind): Promise<Row[]> {
  let p = cache.get(kind);
  if (!p) {
    p = (async () => {
      const mod =
        kind === "live"
          ? await import("./live-data.server")
          : kind === "movie"
            ? await import("./movie-data.server")
            : await import("./series-data.server");
      return decode(mod.default);
    })();
    cache.set(kind, p);
  }
  return p;
}

// Owner overrides from site_settings("smarters"): rename/hide/reorder groups, rename/hide items.
export const configKey = (kind: Kind, part: string | number) => `${kind}:${part}`;
let cfgCache: { at: number; value: Promise<SmartersConfig> } | undefined;
export function clearSmartersConfig() { cfgCache = undefined; }
export function loadConfig(): Promise<SmartersConfig> {
  if (!cfgCache || Date.now() - cfgCache.at > 3_000) {
    cfgCache = {
      at: Date.now(),
      value: (async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "smarters").maybeSingle();
          const v = (data?.value ?? {}) as Partial<SmartersConfig>;
          return { groups: v.groups ?? {}, items: v.items ?? {}, genreOrders: v.genreOrders };
        } catch {
          return { groups: {}, items: {} };
        }
      })(),
    };
  }
  return cfgCache.value;
}

export async function loadKind(kind: Kind, genre: Genre | "" = ""): Promise<Row[]> {
  const [rows, cfg] = await Promise.all([loadRaw(kind), loadConfig()]);
  const firstIndex = new Map<string, number>();
  rows.forEach((r, i) => { if (!firstIndex.has(r[1])) firstIndex.set(r[1], i); });
  const out: [number, number, number, Row][] = [];
  rows.forEach((r, i) => {
    const g = cfg.groups[configKey(kind, r[1])];
    const it = cfg.items[configKey(kind, r[3])];
    if (g?.hidden || it?.hidden || (genre && (kind === "live" || itemGenre(kind, r[3], r[1], cfg) !== genre))) return;
    const order = typeof g?.order === "number" ? g.order : (firstIndex.get(r[1]) ?? i) + 1_000_000;
    out.push([order, typeof it?.order === "number" ? it.order : 1_000_000, i, [it?.label || r[0], g?.label || r[1], r[2], r[3], r[4]]]);
  });
  out.sort((a, b) => (genre ? a[1] - b[1] || a[0] - b[0] : a[0] - b[0] || a[1] - b[1]) || a[2] - b[2]);
  return out.map((x) => x[3]);
}

export function streamUrl(kind: Kind, id: number, ext: string) {
  return `${HOST}/${kind}/${USER}/${PASS}/${id}.${ext}`;
}

export async function groupsOf(kind: Kind) {
  const rows = await loadKind(kind);
  const m = new Map<string, number>();
  for (const r of rows) m.set(r[1], (m.get(r[1]) ?? 0) + 1);
  return [...m.entries()].map(([name, count]) => ({ name, count }));
}

export async function titles(kind: Exclude<Kind, "movie">, q: string, page: number, genre: Genre | "" = "") {
  const rows = await loadKind(kind, genre);
  const ql = q.trim().toLowerCase();
  if (kind === "series") {
    // Series rows are one row per series; episodes load on demand in search().
    const hits = rows.filter((r) => !ql || r[0].toLowerCase().includes(ql) || r[1].toLowerCase().includes(ql));
    return { total: hits.length, titles: hits.slice(page * 60, page * 60 + 60).map((r) => ({ name: r[0], count: 0, logo: r[2] })) };
  }
  const grouped = new Map<string, { count: number; logo: string; matches: boolean }>();
  for (const row of rows) {
    const current = grouped.get(row[1]);
    const matches = !ql || row[1].toLowerCase().includes(ql) || row[0].toLowerCase().includes(ql);
    if (current) {
      current.count += 1;
      current.matches ||= matches;
      if (!current.logo && row[2]) current.logo = row[2];
    } else {
      grouped.set(row[1], { count: 1, logo: row[2], matches });
    }
  }
  const hits = [...grouped.entries()].filter(([, value]) => value.matches);
  const size = 60;
  return {
    total: hits.length,
    titles: hits.slice(page * size, page * size + size).map(([name, value]) => ({
      name,
      count: value.count,
      logo: value.logo,
    })),
  };
}

async function episodes(seriesName: string) {
  const rows = await loadKind("series");
  const row = rows.find((r) => r[0] === seriesName);
  if (!row) return [];
  const res = await fetch(`${HOST}/player_api.php?username=${USER}&password=${PASS}&action=get_series_info&series_id=${row[3]}`, {
    headers: { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20" },
  });
  if (!res.ok) return [];
  const info = (await res.json()) as { episodes?: Record<string, { id: string; title?: string; episode_num?: number; container_extension?: string }[]> };
  const out: Row[] = [];
  for (const [season, list] of Object.entries(info.episodes ?? {})) {
    for (const ep of list ?? []) {
      out.push([ep.title || `الموسم ${season} - الحلقة ${ep.episode_num ?? ""}`, seriesName, row[2], Number(ep.id), ep.container_extension || "mp4"]);
    }
  }
  return out;
}

export async function search(kind: Kind, q: string, group: string, page: number, genre: Genre | "" = "") {
  const rows = kind === "series" && group ? await episodes(group) : await loadKind(kind, genre);
  const ql = q.trim().toLowerCase();
  const hits = rows.filter(
    (r) => (!group || r[1] === group || kind === "series") && (!ql || r[0].toLowerCase().includes(ql)),
  );
  const size = 60;
  return {
    total: hits.length,
    items: hits.slice(page * size, page * size + size).map((r) => ({
      name: r[0],
      group: r[1],
      logo: r[2],
      url: streamUrl(kind, r[3], r[4]),
    })),
  };
}

export async function genresOf(kind: "movie" | "series") {
  const [rows, config] = await Promise.all([loadRaw(kind), loadConfig()]);
  return orderedGenres(kind, config).map((genre) => ({ ...genre, count: rows.filter((r) => !config.groups[configKey(kind, r[1])]?.hidden && !config.items[configKey(kind, r[3])]?.hidden && itemGenre(kind, r[3], r[1], config) === genre.id).length }));
}
