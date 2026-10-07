import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import liveImg from "@/assets/section-live.jpg";
import moviesImg from "@/assets/section-movies.jpg";
import seriesImg from "@/assets/section-series.jpg";
import privateImg from "@/assets/section-private.jpg";

export const Route = createFileRoute("/sections")({
  head: () => ({
    meta: [
      { title: "الأقسام — ALMOGHANI LIVE" },
      { name: "description", content: "اختر ما تريد مشاهدته: البث المباشر، مكتبة الأفلام، المسلسلات، والمكتبة الخاصة." },
      { property: "og:title", content: "الأقسام — ALMOGHANI LIVE" },
      { property: "og:description", content: "البث المباشر والأفلام والمسلسلات والمكتبة الخاصة في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SectionsPage,
});

const cards = [
  { title: "البث المباشر", desc: "قنواتك المفضلة في مكان واحد", cta: "استعرض القنوات", img: liveImg, to: "/live" as const },
  { title: "مكتبة الأفلام", desc: "اكتشف عالم الأفلام", cta: "استعرض الأفلام", img: moviesImg, to: "/movies" as const },
  { title: "المسلسلات", desc: "تابع مسلسلاتك وحلقاتك المفضلة", cta: "استعرض المسلسلات", img: seriesImg, to: "/vip" as const, search: { kind: "series" } },
  { title: "المكتبة الخاصة", desc: "محتوى خاص بالأعضاء", cta: "دخول الأعضاء", img: privateImg, to: "/vip" as const },
];

function SectionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-3 pb-28 pt-6 sm:px-6">
      <header className="mb-6 text-center">
        <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl">الأقسام</h1>
        <p className="mt-2 text-muted-foreground">اختر ما تريد مشاهدته</p>
        <span className="mx-auto mt-3 block h-0.5 w-14 rounded bg-sky" />
      </header>
      <div className="space-y-4">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            search={("search" in c ? c.search : {}) as never}
            className="group grid grid-cols-[1fr_auto] items-center gap-3 overflow-hidden rounded-2xl border border-sky/60 bg-surface-deep p-3 shadow-[0_0_24px_-8px_var(--color-sky)] transition hover:border-sky"
          >
            <div className="min-w-0 space-y-2 p-2">
              <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">{c.title}</h2>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
                {c.cta}
                <ChevronLeft className="h-4 w-4" />
              </span>
            </div>
            <img src={c.img} alt="" loading="lazy" width={478} height={267} className="h-28 w-40 rounded-xl object-cover sm:h-36 sm:w-60" />
          </Link>
        ))}
      </div>
    </main>
  );
}
