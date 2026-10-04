import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Clock, Play } from "lucide-react";
import { movies, type Movie } from "@/lib/movies";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "أفلام مميزة كاملة — ALMOGHANI LIVE" },
      { name: "description", content: "أفلام عربية وعالمية كاملة من قنواتها الرسمية، تُشغَّل داخل الموقع." },
      { property: "og:title", content: "أفلام مميزة كاملة — ALMOGHANI LIVE" },
      { property: "og:description", content: "أفلام عربية وعالمية كاملة من قنواتها الرسمية، تُشغَّل داخل الموقع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  const [current, setCurrent] = useState<Movie>(movies[0]!);
  const [filter, setFilter] = useState<"الكل" | Movie["lang"]>("الكل");
  const list = filter === "الكل" ? movies : movies.filter((m) => m.lang === filter);

  function pick(m: Movie) {
    setCurrent(m);
    document.getElementById("movie-player")?.scrollIntoView({ behavior: "auto", block: "start" });
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link to="/channels/$section" params={{ section: "movies" }} className="icon-button shrink-0" aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-black text-primary sm:text-xl">أفلام مميزة كاملة</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        <section id="movie-player" className="scroll-mt-20">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-deep">
            <div className="aspect-video w-full">
              <iframe
                key={current.youtubeId}
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${current.youtubeId}?autoplay=1&playsinline=1&rel=0`}
                title={current.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <h2 className="text-lg font-bold">{current.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {current.duration} · {current.source}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-2">
          {(["الكل", "عربي", "عالمي"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => pick(m)}
                className={`channel-card w-full text-right ${current.id === m.id ? "channel-card-active" : ""}`}
              >
                <span className="relative block aspect-video overflow-hidden bg-surface-deep">
                  <img
                    src={`https://i.ytimg.com/vi/${m.youtubeId}/hqdefault.jpg`}
                    alt={m.title}
                    loading={i < 3 ? "eager" : "lazy"}
                    decoding="async"
                    width={480}
                    height={360}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-bold">{m.duration}</span>
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/90 text-primary-foreground">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </span>
                </span>
                <span className="block p-3">
                  <span className="block truncate font-bold">{m.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{m.description}</span>
                  <span className="mt-1 block text-[11px] text-primary">{m.lang} · {m.source}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
