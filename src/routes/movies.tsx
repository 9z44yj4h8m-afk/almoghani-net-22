import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Clock, Delete, Lock, Play, Unlock, X } from "lucide-react";
import { type Movie } from "@/lib/movies";
import { getFeaturedMovies } from "@/lib/featured-movies.functions";
import { unlockPrivateMovies } from "@/lib/private-movies.functions";

export const Route = createFileRoute("/movies")({
  loader: () => getFeaturedMovies(),
  head: () => ({
    meta: [
      { title: "أفلام مميزة كاملة — ALMOGHANI LIVE" },
      { name: "description", content: "أحدث الأفلام الكاملة من قنوات روتانا والسبكي الرسمية، تُحدَّث تلقائيًا وتُشغَّل داخل الموقع." },
      { property: "og:title", content: "أفلام مميزة كاملة — ALMOGHANI LIVE" },
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

export function PinPad({ onClose, onUnlock }: { onClose: () => void; onUnlock: (m: Movie[], pin: string) => void }) {
  const unlock = useServerFn(unlockPrivateMovies);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function press(d: string) {
    if (busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setBusy(true);
      const r = await unlock({ data: { pin: next } });
      setBusy(false);
      if (r.ok) { sessionStorage.setItem("vip-pin", next); onUnlock(r.movies, next); }
      else {
        setError(true);
        setPin("");
        navigator.vibrate?.(200);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-background/95 p-6 backdrop-blur" dir="rtl">
      <div className={`w-full max-w-xs text-center ${error ? "animate-pulse" : ""}`}>
        <Lock className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-3 text-xl font-black">أفلام خاصة</h2>
        <p className="mt-1 text-sm text-muted-foreground">أدخل الرقم السري</p>
        <div className="my-6 flex justify-center gap-3" dir="ltr">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-4 w-4 rounded-full border-2 ${error ? "border-destructive" : "border-primary"} ${i < pin.length ? "bg-primary" : ""}`} />
          ))}
        </div>
        {error && <p className="-mt-3 mb-3 text-sm font-bold text-destructive">رقم سري خاطئ</p>}
        <div className="grid grid-cols-3 gap-3" dir="ltr">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-full border border-border bg-card text-2xl font-black active:bg-primary active:text-primary-foreground">
              {d}
            </button>
          ))}
          <button type="button" onClick={onClose} className="h-16 text-sm font-bold text-muted-foreground">إلغاء</button>
          <button type="button" onClick={() => press("0")} className="h-16 rounded-full border border-border bg-card text-2xl font-black active:bg-primary active:text-primary-foreground">0</button>
          <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} className="grid h-16 place-items-center text-muted-foreground" aria-label="حذف">
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MoviesPage() {
  const all = Route.useLoaderData();
  const [filter, setFilter] = useState<"الكل" | Movie["lang"] | "خاص">("الكل");
  const [playing, setPlaying] = useState<Movie | null>(null);
  const [privateList, setPrivateList] = useState<Movie[] | null>(null);
  const [askPin, setAskPin] = useState(false);
  const list = filter === "خاص" ? privateList ?? [] : filter === "الكل" ? all : all.filter((m) => m.lang === filter);

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link to="/" className="icon-button shrink-0" aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-black text-primary sm:text-xl">أفلام مميزة كاملة</h1>
          <span className="ms-auto text-xs text-muted-foreground">{list.length} فيلم</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl pt-4">
        <div className="flex gap-2 px-4">
          {(["الكل", "عربي", "عالمي"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => (privateList ? setFilter("خاص") : setAskPin(true))}
            className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-bold ${filter === "خاص" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
          >
            {privateList ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} خاص
          </button>
          {privateList && (
            <button
              type="button"
              onClick={() => {
                setPrivateList(null);
                setFilter("الكل");
              }}
              className="ms-auto text-xs font-bold text-muted-foreground"
            >
              قفل
            </button>
          )}
        </div>
        {filter === "خاص" && list.length === 0 && (
          <p className="mt-8 px-4 text-center text-sm text-muted-foreground">لا توجد أفلام خاصة بعد.</p>
        )}

        {/* Vertical list with compact covers */}
        <div className="mt-4 grid gap-3 px-4 lg:grid-cols-2">
          {list.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPlaying(m)}
              className="channel-card flex w-full items-stretch gap-3 overflow-hidden p-2 text-right"
            >
              <span className="relative block aspect-video w-36 shrink-0 self-start overflow-hidden rounded-md bg-surface-deep sm:w-48">
                <Cover id={m.youtubeId} alt={m.title} eager={i < 4} />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-live">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col py-1">
                <span className="line-clamp-2 block text-base font-black leading-tight">{m.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {m.duration} · {m.lang}
                </span>
                <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{m.description}</span>
                <span className="mt-auto block truncate text-xs text-primary">{m.source}</span>
              </span>
            </button>
          ))}
        </div>
      </main>

      {askPin && (
        <PinPad
          onClose={() => setAskPin(false)}
          onUnlock={(m) => {
            setPrivateList(m);
            setFilter("خاص");
            setAskPin(false);
          }}
        />
      )}

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
