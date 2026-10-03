import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  CirclePlay,
  Home,
  ListVideo,
  Play,
  Radio,
  Search,
  Signal,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useState } from "react";

type Channel = {
  id: string;
  name: string;
  category: "سعودية" | "رياضية" | "إسلامية" | "إخبارية";
  youtubeId: string;
  thumbnail: string;
  description: string;
};

const channels: Channel[] = [
  {
    id: "aljazeera",
    name: "قناة الجزيرة",
    category: "إخبارية",
    youtubeId: "bNyUyrR0PHo",
    thumbnail: "https://i.ytimg.com/vi/bNyUyrR0PHo/hqdefault.jpg",
    description: "التغطية مستمرة على مدار الساعة",
  },
];

const sections = [
  { title: "القنوات السعودية", category: "سعودية" as const },
  { title: "القنوات الرياضية", category: "رياضية" as const },
  { title: "القنوات الإسلامية", category: "إسلامية" as const },
  { title: "القنوات الإخبارية", category: "إخبارية" as const },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALMOGHANI LIVE — بث مباشر" },
      {
        name: "description",
        content: "شاهد القنوات المباشرة داخل ALMOGHANI LIVE بواجهة عربية سريعة وواضحة.",
      },
      { property: "og:title", content: "ALMOGHANI LIVE — بث مباشر" },
      {
        property: "og:description",
        content: "مشاهدة القنوات المباشرة من مشغّل واحد داخل الموقع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://i.ytimg.com/vi/bNyUyrR0PHo/hqdefault.jpg" },
      { name: "twitter:image", content: "https://i.ytimg.com/vi/bNyUyrR0PHo/hqdefault.jpg" },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState(channels[0]);
  const [searchOpen, setSearchOpen] = useState(false);

  if (!selected) return null;

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <a href="#player" className="flex min-w-0 items-center gap-3" aria-label="ALMOGHANI LIVE">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-live shadow-live sm:h-11 sm:w-11">
              <Radio className="h-5 w-5 text-live-foreground" />
              <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-signal animate-live-pulse" />
            </span>
            <span className="min-w-0 truncate text-left font-display text-lg font-black sm:text-2xl">
              ALMOGHANI <span className="text-signal">LIVE</span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            <nav className="ml-3 hidden items-center gap-6 text-sm font-bold text-muted-foreground md:flex">
              <a className="text-foreground transition-colors hover:text-sky" href="#player">الرئيسية</a>
              <a className="transition-colors hover:text-sky" href="#channels">القنوات</a>
              <a className="transition-colors hover:text-sky" href="#categories">الأقسام</a>
            </nav>
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              className="icon-button"
              aria-label="بحث"
              title="بحث"
            >
              <Search className="h-5 w-5" />
            </button>
            <button type="button" className="icon-button hidden sm:grid" aria-label="التنبيهات" title="التنبيهات">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="mx-auto max-w-7xl animate-slide-down px-4 pb-4 sm:px-6 lg:px-8">
            <label className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="ابحث عن قناة..."
                autoFocus
              />
            </label>
          </div>
        )}
      </header>

      <main className="pb-24 md:pb-12">
        <section id="player" className="relative border-b border-border/60">
          <div className="broadcast-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-sky sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>البث المختار</span>
                </div>
                <h1 className="truncate font-display text-2xl font-black sm:text-4xl">{selected.name}</h1>
              </div>
              <div className="live-badge shrink-0">
                <span className="h-2 w-2 rounded-full bg-live-foreground animate-live-pulse" />
                مباشر الآن
              </div>
            </div>

            <div className="player-shell animate-fade-up">
              <div className="aspect-video w-full overflow-hidden bg-surface-deep">
                <iframe
                  key={selected.youtubeId}
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}?autoplay=1&rel=0`}
                  title={`البث المباشر — ${selected.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border bg-surface px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-sky">
                    <Signal className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{selected.name}</p>
                    <p className="truncate text-xs text-muted-foreground sm:text-sm">{selected.description}</p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 text-xs font-bold text-muted-foreground sm:flex">
                  <Volume2 className="h-4 w-4 text-sky" />
                  يعمل داخل الموقع
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="border-b border-border/60 bg-surface/40 py-4">
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {sections.map((section, index) => (
              <a
                key={section.title}
                href={`#section-${index}`}
                className={`category-pill ${section.category === selected.category ? "category-pill-active" : ""}`}
              >
                {section.title}
              </a>
            ))}
          </div>
        </section>

        <div id="channels" className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          {sections.map((section, index) => {
            const sectionChannels = channels.filter((channel) => channel.category === section.category);
            return (
              <section id={`section-${index}`} key={section.title} className="scroll-mt-28">
                <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:mb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-7 w-1 shrink-0 rounded-full ${sectionChannels.length ? "bg-signal" : "bg-sky"}`} />
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-black sm:text-2xl">{section.title}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sectionChannels.length ? `${sectionChannels.length} قناة متاحة` : "بانتظار إضافة روابط القنوات"}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>

                {sectionChannels.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sectionChannels.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => {
                          setSelected(channel);
                          document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`channel-card ${selected.id === channel.id ? "channel-card-active" : ""}`}
                      >
                        <span className="relative block aspect-video overflow-hidden bg-surface-deep">
                          <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={channel.thumbnail} alt={`صورة ${channel.name}`} />
                          <span className="absolute inset-0 bg-player-overlay" />
                          <span className="absolute left-3 top-3 live-badge py-1 text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-live-foreground" />
                            LIVE
                          </span>
                          <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-signal text-live-foreground shadow-live">
                              <Play className="h-5 w-5 fill-current" />
                            </span>
                          </span>
                        </span>
                        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-right">
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{channel.name}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">{channel.description}</span>
                          </span>
                          <CirclePlay className="h-6 w-6 shrink-0 text-sky" />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-channel-row">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                      <ListVideo className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">لا توجد قنوات مضافة بعد</p>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">ستظهر القنوات هنا عند تزويدي بالاسم ورابط البث.</p>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-3 border-t border-border bg-background/95 px-6 backdrop-blur-xl md:hidden" aria-label="التنقل السريع">
        <a href="#player" className="mobile-nav-item text-signal"><Home className="h-5 w-5" /><span>الرئيسية</span></a>
        <a href="#channels" className="mobile-nav-item"><ListVideo className="h-5 w-5" /><span>القنوات</span></a>
        <a href="#player" className="relative -top-4 mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-live text-live-foreground shadow-live" aria-label="شغّل البث">
          <Play className="h-6 w-6 fill-current" />
        </a>
      </nav>
    </div>
  );
}