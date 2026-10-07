import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Heart, Lock, Search, X } from "lucide-react";
import { type Movie } from "@/lib/movies";
import { getFeaturedMovies } from "@/lib/featured-movies.functions";
import { useSiteConfig, applyMovieConfig } from "@/lib/site-config";

export const Route = createFileRoute("/movies")({
  validateSearch: (search: Record<string, unknown>): { lang?: "عربي" | "عالمي" } => ({
    lang: search.lang === "عربي" || search.lang === "عالمي" ? search.lang : undefined,
  }),
  loader: () => getFeaturedMovies(),
  head: () => ({
    meta: [
      { title: "أفلام مميزة كاملة — المغني لايف" },
      { name: "description", content: "أحدث الأفلام الكاملة من قنوات روتانا والسبكي الرسمية، تُحدَّث تلقائيًا وتُشغَّل داخل الموقع." },
      { property: "og:title", content: "أفلام مميزة كاملة — المغني لايف" },
      { property: "og:description", content: "أحدث الأفلام الكاملة من القنوات الرسمية، تُحدَّث تلقائيًا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoviesPage,
});

function Cover({ id, alt, eager }: { id: string; alt: string; eager?: boolean }) {
  return (
    <img
      src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={1280}
      height={720}
      className="h-full w-full object-cover"
    />
  );
}

function MoviesPage() {
  const { lang } = Route.useSearch();
  const loaded = Route.useLoaderData();
  const { data: siteConfig } = useSiteConfig();
  const all = applyMovieConfig(loaded, siteConfig);
  const [filter, setFilter] = useState<"الكل" | Movie["lang"] | "المفضلة">(lang ?? "الكل");
  useEffect(() => { setFilter(lang ?? "الكل"); }, [lang]);
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [playing, setPlaying] = useState<Movie | null>(null);
  useEffect(() => { try { setFavs(JSON.parse(localStorage.getItem("movie-favs") ?? "[]")); } catch { /* ignore */ } }, []);
  const toggleFav = (id: string) => setFavs((f) => { const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; localStorage.setItem("movie-favs", JSON.stringify(n)); return n; });
  const list = all
    .filter((m) => filter === "الكل" || (filter === "المفضلة" ? favs.includes(m.id) : m.lang === filter))
    .filter((m) => !q.trim() || m.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 text-foreground">
      <main className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="icon-button shrink-0" aria-label="رجوع"><ArrowRight className="h-5 w-5" /></Link>
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-sky/50 bg-surface-deep/70 px-4 py-3 focus-within:border-sky">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن فيلم..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <Search className="h-5 w-5 shrink-0 text-foreground" />
          </label>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-sky/40 p-2">
          {(["الكل", "عربي", "عالمي", "المفضلة"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`shrink-0 rounded-xl border px-5 py-2 text-sm font-black ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-sky/40 text-foreground"}`}>{f}</button>
          ))}
          <Link to="/vip" search={{ kind: "movie" }} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-sky/40 px-5 py-2 text-sm font-black"><Lock className="h-3.5 w-3.5" /> خاص</Link>
        </div>

        <h1 className="mt-6 flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
          <span className="h-8 w-1.5 rounded-full bg-primary" />أفلام مميزة كاملة
          <span className="ms-auto text-xs font-bold text-muted-foreground">{list.length} فيلم</span>
        </h1>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {list.map((m, i) => (
            <div key={m.id} className="relative aspect-[16/10] overflow-hidden rounded-xl border border-sky/50 bg-surface-deep shadow-lg">
              <Cover id={m.youtubeId} alt={m.title} eager={i < 4} />
              <span className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_92%,transparent)_0%,color-mix(in_oklab,var(--background)_55%,transparent)_45%,transparent_75%)]" />
              <div className="absolute inset-0 flex flex-col items-start p-3">
                <div className="flex w-full items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-sm font-black leading-tight sm:text-lg">{m.title}</span>
                    <span className="mt-1 block text-[11px] font-bold text-foreground/75 sm:text-sm">{m.lang} · {m.duration}</span>
                  </span>
                  <button type="button" aria-label="المفضلة" onClick={() => toggleFav(m.id)} className="shrink-0">
                    <Heart className={`h-5 w-5 ${favs.includes(m.id) ? "fill-primary text-primary" : "text-foreground"}`} />
                  </button>
                </div>
                <button type="button" onClick={() => setPlaying(m)} className="mt-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-live sm:px-5 sm:py-2 sm:text-base">شاهد الآن</button>
              </div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="py-16 text-center text-muted-foreground">لا توجد أفلام مطابقة.</p>}
      </main>

      {playing && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background">
          <div className="flex h-14 items-center gap-2 border-b border-border px-4">
            <button type="button" className="icon-button" aria-label="إغلاق" onClick={() => setPlaying(null)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="truncate font-bold">{playing.title}</h2>
          </div>
          <div className="aspect-video w-full bg-surface-deep">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1&playsinline=1&rel=0`}
              title={playing.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">{playing.description}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {playing.duration} · {playing.source}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
