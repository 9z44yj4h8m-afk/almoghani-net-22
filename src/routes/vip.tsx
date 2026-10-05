import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Copy, ExternalLink, Lock, Play, Search, X } from "lucide-react";
import { PinPad } from "./movies";
import { getLibraryGroups, searchLibrary } from "@/lib/iptv/library.functions";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "المكتبة الخاصة — ALMOGHANI LIVE" },
      { name: "description", content: "مكتبة خاصة محمية برقم سري: بث مباشر وأفلام ومسلسلات." },
      { property: "og:title", content: "المكتبة الخاصة — ALMOGHANI LIVE" },
      { property: "og:description", content: "قسم خاص محمي برقم سري." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VipPage,
});

type Kind = "live" | "movie" | "series";
type Item = { name: string; group: string; logo: string; url: string };
const TABS: { k: Kind; label: string }[] = [
  { k: "live", label: "بث مباشر" },
  { k: "movie", label: "أفلام" },
  { k: "series", label: "مسلسلات" },
];

function VipPage() {
  const [pin, setPin] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<Kind>("live");
  const [groups, setGroups] = useState<{ name: string; count: number }[]>([]);
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<Item | null>(null);
  const fetchGroups = useServerFn(getLibraryGroups);
  const fetchItems = useServerFn(searchLibrary);

  useEffect(() => {
    setPin(sessionStorage.getItem("vip-pin"));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!pin) return;
    setGroup("");
    fetchGroups({ data: { pin, kind } }).then(setGroups).catch(() => setPin(null));
  }, [pin, kind]);

  useEffect(() => {
    if (!pin) return;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetchItems({ data: { pin, kind, q, group, page } });
        setItems((prev) => (page === 0 ? r.items : [...prev, ...r.items]));
        setTotal(r.total);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pin, kind, q, group, page]);

  useEffect(() => setPage(0), [kind, q, group]);

  if (!ready) return null;
  if (!pin)
    return (
      <PinPad
        onClose={() => history.back()}
        onUnlock={(_m, p) => setPin(p)}
      />
    );

  const copy = (u: string) => navigator.clipboard.writeText(u).then(() => alert("تم نسخ الرابط"));

  return (
    <div className="min-h-screen bg-background pb-16" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/movies" className="grid h-10 w-10 place-items-center rounded-full border border-border" aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-lg font-black">المكتبة الخاصة</h1>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("vip-pin");
              setPin(null);
            }}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground"
          >
            <Lock className="h-4 w-4" /> قفل
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setKind(t.k)}
              className={`flex-1 rounded-full border py-2 text-sm font-bold ${kind === t.k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم…"
              className="w-full rounded-full border border-border bg-card py-2 pe-3 ps-9 text-sm"
            />
          </div>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-36 rounded-full border border-border bg-card px-3 text-xs"
          >
            <option value="">كل التصنيفات</option>
            {groups.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name} ({g.count})
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{busy && page === 0 ? "جارٍ التحميل…" : `${total.toLocaleString("ar")} نتيجة`}</p>
      </header>

      <ul className="divide-y divide-border">
        {items.map((it, i) => (
          <li key={it.url + i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-card">
              {it.logo && <img src={it.logo} alt="" loading="lazy" className="h-full w-full object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{it.name}</p>
              <p className="truncate text-xs text-muted-foreground">{it.group}</p>
            </div>
            <button type="button" onClick={() => setPlaying(it)} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="تشغيل">
              <Play className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < total && (
        <button type="button" disabled={busy} onClick={() => setPage((p) => p + 1)} className="mx-auto mt-4 block rounded-full border border-border px-6 py-2 text-sm font-bold">
          {busy ? "جارٍ التحميل…" : "عرض المزيد"}
        </button>
      )}

      {playing && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-background/80 backdrop-blur sm:place-items-center" onClick={() => setPlaying(null)}>
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black">{playing.name}</h2>
              <button type="button" onClick={() => setPlaying(null)} aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>
            <a href="https://almoghani.net" className="mt-1 block text-xs font-bold text-primary" dir="ltr">almoghani.net</a>
            <div className="mt-4 grid gap-2">
              <a href={playing.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground">
                <Play className="h-4 w-4" /> تشغيل
              </a>
              <a
                href={
                  /android/i.test(navigator.userAgent)
                    ? `intent:${playing.url}#Intent;package=org.videolan.vlc;type=video/*;end`
                    : `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(playing.url)}`
                }
                className="flex items-center justify-center gap-2 rounded-full border border-border py-3 font-bold"
              >
                <ExternalLink className="h-4 w-4" /> فتح في VLC
              </a>
              <a href={`outplayer://${playing.url}`} className="flex items-center justify-center gap-2 rounded-full border border-border py-3 font-bold">
                <ExternalLink className="h-4 w-4" /> فتح في Outplayer
              </a>
              <button type="button" onClick={() => copy(playing.url)} className="flex items-center justify-center gap-2 rounded-full border border-border py-3 font-bold">
                <Copy className="h-4 w-4" /> نسخ رابط البث
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
