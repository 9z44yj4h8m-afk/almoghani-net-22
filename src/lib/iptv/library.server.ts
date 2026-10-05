// Private IPTV library (owner's personal subscription). Never import from client code.
export type Kind = "live" | "movie" | "series";
type Row = [name: string, group: string, logo: string, id: number, ext: string];

const HOST = "http://ebh48.top:80";
const USER = "169704281902";
const PASS = "425912890502";

const cache = new Map<Kind, Promise<Row[]>>();

async function decode(b64: string): Promise<Row[]> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

export function loadKind(kind: Kind): Promise<Row[]> {
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

export function streamUrl(kind: Kind, id: number, ext: string) {
  return `${HOST}/${kind}/${USER}/${PASS}/${id}.${ext}`;
}

export async function groupsOf(kind: Kind) {
  const rows = await loadKind(kind);
  const m = new Map<string, number>();
  for (const r of rows) m.set(r[1], (m.get(r[1]) ?? 0) + 1);
  return [...m.entries()].map(([name, count]) => ({ name, count }));
}

export async function search(kind: Kind, q: string, group: string, page: number) {
  const rows = await loadKind(kind);
  const ql = q.trim().toLowerCase();
  const hits = rows.filter(
    (r) => (!group || r[1] === group) && (!ql || r[0].toLowerCase().includes(ql)),
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
