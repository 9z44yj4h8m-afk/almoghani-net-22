import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Clapperboard, Film, History, Play, Search, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMember } from "@/components/member-provider";
import { browseSmartersChannels } from "@/lib/iptv/library.functions";
import { SmartersBanners } from "@/components/smarters-banners";

const RECENT_KEY = "smarters-recent";
type Recent = { name: string; group: string };

export function SmartersCatalog({ onMemberWatch }: { onMemberWatch: (group: string) => void }) {
  const { user, ready } = useMember();
  const browse = useServerFn(browseSmartersChannels);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState("");
  const [recent, setRecent] = useState<Recent[]>([]);
  const catalog = useQuery({ queryKey: ["smarters-public", q, group, page], queryFn: () => browse({ data: { q, group, page } }), staleTime: 60000 });

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 8)); } catch { setRecent([]); }
  }, []);

  const scrollToList = () => document.getElementById("smarters-channel-list")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  const open = (item: Recent) => {
    const next = [item, ...recent.filter((r) => r.name !== item.name)].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (user) onMemberWatch(item.group); else setSelected(item.name);
  };
  const tiles = [
    { label: "بث مباشر", sub: "Live TV", Icon: Tv, cls: "bg-primary text-primary-foreground", to: "/vip" as const, kind: "live" },
    { label: "الأفلام", sub: "Movies", Icon: Film, cls: "bg-accent text-accent-foreground", to: "/vip" as const, kind: "movie" },
    { label: "المسلسلات", sub: "Series", Icon: Clapperboard, cls: "bg-secondary text-secondary-foreground", to: "/vip" as const, kind: "series" },
  ];

  return <main dir="rtl" className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">
    <header className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
      <Link to="/" aria-label="الرئيسية" className="grid h-10 w-10 place-items-center rounded-lg border border-border text-muted-foreground"><ArrowRight className="h-5 w-5" /></Link>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold tracking-widest text-primary" dir="ltr">ALMOGHANI LIVE</p>
        <h1 className="truncate text-lg font-black sm:text-xl">Almoghani Smarter pro</h1>
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-live px-3 py-1 text-xs font-black text-live-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-live-foreground" />مباشر</span>
    </header>

    <nav aria-label="أقسام سمارتر" className="mt-5 grid grid-cols-3 gap-3">
      {tiles.map(({ label, sub, Icon, cls, kind }) => kind === "live"
        ? <button key={kind} type="button" onClick={scrollToList} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-xl shadow-lg transition-transform active:scale-95 sm:h-40 ${cls}`}><Icon className="h-8 w-8 sm:h-11 sm:w-11" /><span className="text-sm font-black sm:text-xl">{label}</span><span className="text-[10px] font-bold opacity-75" dir="ltr">{sub}</span></button>
        : <Link key={kind} to="/vip" search={{ kind }} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-xl shadow-lg transition-transform active:scale-95 sm:h-40 ${cls}`}><Icon className="h-8 w-8 sm:h-11 sm:w-11" /><span className="text-sm font-black sm:text-xl">{label}</span><span className="text-[10px] font-bold opacity-75" dir="ltr">{sub}</span></Link>)}
    </nav>

    <label className="relative mt-5 block">
      <span className="sr-only">ابحث عن قناة سمارتر</span>
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input aria-label="ابحث عن قناة سمارتر" placeholder="ابحث عن قناة…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="h-12 w-full rounded-xl border border-border bg-card pe-3 ps-10 text-foreground outline-none focus:border-primary" />
    </label>

    {recent.length > 0 && <section className="mt-6" aria-label="شاهد حديثًا">
      <h2 className="mb-3 flex items-center gap-2 text-base font-black"><History className="h-4 w-4 text-primary" />شاهد حديثًا</h2>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{recent.map((r) => <button key={r.name} type="button" disabled={!ready} onClick={() => open(r)} className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold"><Play className="h-3.5 w-3.5 text-primary" /><span className="max-w-40 truncate">{r.name}</span></button>)}</div>
    </section>}

    <div className="mt-6"><SmartersBanners onBrowse={(query) => { setQ(query); setGroup(""); setPage(0); scrollToList(); }} /></div>

    <div id="smarters-channel-list" className="scroll-mt-24 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-black">{q ? `نتائج البحث: ${q}` : "جميع القنوات"}</h2>
      {(q || group) && <Button variant="outline" size="sm" onClick={() => { setQ(""); setGroup(""); setPage(0); }}>جميع القنوات</Button>}
    </div>

    <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="تصنيف قنوات سمارتر">
      <button type="button" onClick={() => { setGroup(""); setPage(0); }} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold ${group === "" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>الكل</button>
      {catalog.data?.groups.map((name) => <button key={name} type="button" onClick={() => { setGroup(name); setPage(0); }} className={`max-w-52 shrink-0 truncate rounded-full border px-4 py-1.5 text-sm font-bold ${group === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{name}</button>)}
    </div>

    {catalog.isPending && <p role="status" className="mt-5">جارٍ تحميل القنوات…</p>}
    {catalog.isError && <div role="alert" className="mt-5"><p>تعذّر تحميل القنوات.</p><Button variant="outline" onClick={() => void catalog.refetch()}>إعادة المحاولة</Button></div>}
    <ul aria-label="قنوات سمارتر" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{catalog.data?.items.map((item, index) => <li key={`${item.name}-${index}`}>
      <button type="button" disabled={!ready} onClick={() => open(item)} className="group relative flex h-32 w-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-3 text-right transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none">
        <span className="flex items-start justify-between gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary"><Tv className="h-5 w-5 text-primary" /></span>
          <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-black text-live-foreground">مباشر</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{item.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{item.group}</span>
        </span>
        <span className="absolute inset-x-0 bottom-0 h-1 bg-primary/0 transition-colors group-hover:bg-primary" />
      </button>
    </li>)}</ul>
    {catalog.data && catalog.data.total === 0 && <p className="py-10 text-center text-muted-foreground">لا توجد قنوات مطابقة.</p>}
    {catalog.data && catalog.data.total > 60 && <div className="mt-6 flex items-center justify-center gap-4"><Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>السابق</Button><span>{page + 1}</span><Button variant="outline" disabled={(page + 1) * 60 >= catalog.data.total} onClick={() => setPage((p) => p + 1)}>التالي</Button></div>}
    <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(""); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>التسجيل لمشاهدة القناة</DialogTitle><DialogDescription>{selected}</DialogDescription></DialogHeader><Button asChild><Link to="/auth" onClick={() => sessionStorage.setItem("member-destination", "/vip?kind=live")}>تسجيل الدخول أو إنشاء حساب</Link></Button></DialogContent></Dialog>
  </main>;
}
