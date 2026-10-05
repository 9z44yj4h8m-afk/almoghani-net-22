import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  Clapperboard,
  Copy,
  ExternalLink,
  Film,
  Home,
  Lock,
  Play,
  Search,
  Tv,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const TABS: {
  k: Kind;
  label: string;
  eyebrow: string;
  Icon: typeof Tv;
  activeClass: string;
}[] = [
  { k: "live", label: "بث مباشر", eyebrow: "شاهد الآن", Icon: Tv, activeClass: "bg-live text-live-foreground" },
  { k: "movie", label: "الأفلام", eyebrow: "مكتبة الأفلام", Icon: Film, activeClass: "bg-primary text-primary-foreground" },
  { k: "series", label: "المسلسلات", eyebrow: "جميع الحلقات", Icon: Clapperboard, activeClass: "bg-accent text-accent-foreground" },
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
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const result = await fetchItems({ data: { pin, kind, q, group, page } });
        setItems((current) => (page === 0 ? result.items : [...current, ...result.items]));
        setTotal(result.total);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [pin, kind, q, group, page]);

  useEffect(() => setPage(0), [kind, q, group]);

  if (!ready) return null;
  if (!pin) {
    return <PinPad onClose={() => history.back()} onUnlock={(_movies, unlockedPin) => setPin(unlockedPin)} />;
  }

  const activeTab = TABS.find((tab) => tab.k === kind) ?? TABS[0];
  if (!activeTab) return null;
  const copy = (url: string) => navigator.clipboard.writeText(url).then(() => alert("تم نسخ الرابط"));
  const lock = () => {
    sessionStorage.removeItem("vip-pin");
    setPin(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 pb-4 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/movies" className="icon-button" aria-label="رجوع إلى الأفلام">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Tv className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-accent">ALMOGHANI LIVE</p>
              <h1 className="truncate text-xl font-black">المكتبة الخاصة</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={lock} aria-label="قفل المكتبة" title="قفل المكتبة">
              <Lock className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <section className="grid grid-cols-2 gap-3" aria-label="أقسام المكتبة">
          {TABS.map(({ k, label, eyebrow, Icon, activeClass }, index) => {
            const active = kind === k;
            return (
              <Button
                key={k}
                type="button"
                variant="outline"
                onClick={() => setKind(k)}
                className={`group h-auto min-w-0 justify-between overflow-hidden p-4 text-right transition-transform active:scale-[0.98] ${index === 0 ? "col-span-2 min-h-28" : "min-h-32 flex-col items-start"} ${active ? activeClass : "border-border bg-card text-card-foreground hover:bg-secondary"}`}
                aria-pressed={active}
              >
                <span className="flex min-w-0 flex-col items-start">
                  <span className={`text-xs font-bold ${active ? "opacity-80" : "text-muted-foreground"}`}>{eyebrow}</span>
                  <span className={`${index === 0 ? "text-2xl" : "text-lg"} font-black`}>{label}</span>
                  <span className={`mt-1 text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {active ? `${total.toLocaleString("ar")} نتيجة` : "اضغط للاستعراض"}
                  </span>
                </span>
                <span className={`grid shrink-0 place-items-center rounded-full ${index === 0 ? "h-14 w-14" : "h-11 w-11"} ${active ? "bg-background/20" : "bg-secondary"}`}>
                  <Icon className={index === 0 ? "h-7 w-7" : "h-6 w-6"} />
                </span>
              </Button>
            );
          })}
        </section>

        <section className="mt-6" aria-label="البحث والتصنيف">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground">تصفّح الآن</p>
              <h2 className="text-lg font-black">{activeTab.label}</h2>
            </div>
            <span className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {busy && page === 0 ? "جارٍ التحميل…" : `${total.toLocaleString("ar")} عنصر`}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_15rem]">
            <label className="relative block">
              <span className="sr-only">ابحث في المكتبة</span>
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="ابحث بالاسم…"
                className="h-11 w-full rounded-lg border border-input bg-card pe-3 ps-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <label>
              <span className="sr-only">اختر التصنيف</span>
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              >
                <option value="">كل التصنيفات</option>
                {groups.map((entry) => (
                  <option key={entry.name} value={entry.name}>
                    {entry.name} ({entry.count.toLocaleString("ar")})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              size="sm"
              variant={group === "" ? "default" : "outline"}
              onClick={() => setGroup("")}
              className="shrink-0"
            >
              الكل
            </Button>
            {groups.slice(0, 8).map((entry) => (
              <Button
                key={entry.name}
                type="button"
                size="sm"
                variant={group === entry.name ? "default" : "outline"}
                onClick={() => setGroup(entry.name)}
                className="shrink-0"
              >
                {entry.name}
              </Button>
            ))}
          </div>
        </section>

        <ul className="mt-5 grid gap-2 lg:grid-cols-2">
          {items.map((item, index) => (
            <li key={`${item.url}-${index}`}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPlaying(item)}
                className="group h-auto w-full justify-start gap-3 border border-border bg-card p-3 text-right hover:border-primary hover:bg-secondary"
              >
                <span className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain p-1"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  ) : (
                    <activeTab.Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{item.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.group}</span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <Play className="h-4 w-4" />
                </span>
              </Button>
            </li>
          ))}
        </ul>

        {!busy && items.length === 0 && (
          <div className="mt-5 border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            لا توجد نتائج مطابقة.
          </div>
        )}

        {items.length < total && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => setPage((current) => current + 1)} className="mx-auto mt-5 flex">
            {busy ? "جارٍ التحميل…" : "عرض المزيد"}
          </Button>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-6 py-3 backdrop-blur-xl sm:hidden" aria-label="تنقل المكتبة">
        <div className="mx-auto flex max-w-sm items-center justify-around">
          <Link to="/" className="mobile-nav-item">
            <Home className="h-5 w-5" />
            <span>الرئيسية</span>
          </Link>
          {TABS.map(({ k, label, Icon }) => (
            <Button
              key={k}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setKind(k)}
              className={`h-auto flex-col gap-1 px-2 py-0 text-[0.65rem] ${kind === k ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {playing && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-background/85 backdrop-blur-sm sm:place-items-center" onClick={() => setPlaying(null)}>
          <section className="w-full max-w-md rounded-t-lg border border-border bg-card p-5 shadow-2xl sm:rounded-lg" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label={playing.name}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-accent">جاهز للمشاهدة</p>
                <h2 className="truncate text-lg font-black">{playing.name}</h2>
                <p className="truncate text-xs text-muted-foreground">{playing.group}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setPlaying(null)} aria-label="إغلاق">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <a href="https://almoghani.net" className="mt-3 flex items-center gap-1 text-xs font-bold text-primary" dir="ltr">
              almoghani.net <ChevronLeft className="h-3 w-3" />
            </a>
            <div className="mt-5 grid gap-2">
              <Button asChild size="lg" className="h-12 w-full">
                <a href={`vlc://${playing.url}`}>
                  <ExternalLink className="h-4 w-4" /> فتح في VLC
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 w-full">
                <a href={`outplayer://${playing.url}`}>
                  <ExternalLink className="h-4 w-4" /> فتح في Outplayer
                </a>
              </Button>
              <Button type="button" variant="ghost" size="lg" className="h-12 w-full" onClick={() => copy(playing.url)}>
                <Copy className="h-4 w-4" /> نسخ رابط البث
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}