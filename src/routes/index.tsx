import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  WandSparkles,
  Volume2,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { searchChannelsWithAi } from "@/lib/channel-search.functions";

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
  {
    id: "alarabiya",
    name: "قناة العربية",
    category: "إخبارية",
    youtubeId: "n7eQejkXbnM",
    thumbnail: "https://i.ytimg.com/vi/n7eQejkXbnM/hqdefault.jpg",
    description: "آخر الأخبار والعواجل لحظة بلحظة",
  },
  {
    id: "saudi-quran",
    name: "قناة القرآن الكريم",
    category: "إسلامية",
    youtubeId: "eC4LfEVxvKg",
    thumbnail: "https://i.ytimg.com/vi/eC4LfEVxvKg/hqdefault.jpg",
    description: "بث مباشر من مكة المكرمة",
  },
  {
    id: "alhadath",
    name: "قناة الحدث",
    category: "إخبارية",
    youtubeId: "au8t81S0tag",
    thumbnail: "https://i.ytimg.com/vi/au8t81S0tag/hqdefault.jpg",
    description: "البث الإخباري المباشر لقناة الحدث",
  },
  {
    id: "saudi-news",
    name: "قناة الإخبارية",
    category: "سعودية",
    youtubeId: "iw0YDBYgaUU",
    thumbnail: "https://i.ytimg.com/vi/iw0YDBYgaUU/hqdefault.jpg",
    description: "البث المباشر لقناة الإخبارية السعودية",
  },
  {
    id: "alarabiya-business",
    name: "العربية Business",
    category: "إخبارية",
    youtubeId: "iHr7P4kZYrk",
    thumbnail: "https://i.ytimg.com/vi/iHr7P4kZYrk/hqdefault.jpg",
    description: "أخبار الاقتصاد والأسواق والأعمال مباشرة",
  },
  {
    id: "france24-arabic",
    name: "فرانس 24 عربي",
    category: "إخبارية",
    youtubeId: "93g513Uth98",
    thumbnail: "https://i.ytimg.com/vi/93g513Uth98/hqdefault.jpg",
    description: "الأخبار الدولية على مدار الساعة",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const searchWithAi = useServerFn(searchChannelsWithAi);

  const searchResults = searchResultIds
    ?.map((id) => channels.find((channel) => channel.id === id))
    .filter((channel): channel is Channel => Boolean(channel));

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError("اكتب اسم قناة أو وصفًا من كلمتين على الأقل.");
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResultIds(null);
    try {
      const result = await searchWithAi({
        data: {
          query,
          channels: channels.map(({ id, name, category, description }) => ({ id, name, category, description })),
        },
      });
      setSearchResultIds(result.ids);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "تعذّر إكمال البحث الذكي.");
    } finally {
      setSearching(false);
    }
  }

  function playChannel(channel: Channel) {
    setSelected(channel);
    setSearchOpen(false);
    document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
  }

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
              onClick={() => {
                setSearchOpen((value) => !value);
                setSearchError("");
              }}
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
            <form onSubmit={handleSearch} className="ai-search-panel">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-sky">
                <WandSparkles className="h-4 w-4" />
                بحث ذكي في القنوات المتاحة
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 focus-within:border-sky">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="مثال: قناة أخبار بتغطية مستمرة"
                    autoFocus
                    maxLength={200}
                    aria-label="اسم القناة أو وصفها"
                  />
                </label>
                <Button type="submit" size="lg" disabled={searching} className="h-12 bg-sky px-6 text-accent-foreground hover:bg-sky/90">
                  {searching ? <span className="ai-search-spinner" /> : <WandSparkles />}
                  {searching ? "جارٍ البحث" : "ابحث بالذكاء الاصطناعي"}
                </Button>
              </div>

              {searchError && <p role="alert" className="mt-3 text-sm font-bold text-signal">{searchError}</p>}

              {searchResults && (
                <div className="mt-4 border-t border-border pt-4">
                  {searchResults.length ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {searchResults.map((channel) => (
                        <Button
                          key={channel.id}
                          type="button"
                          variant="secondary"
                          onClick={() => playChannel(channel)}
                          className="h-auto min-w-0 justify-start whitespace-normal p-3 text-right"
                        >
                          <img src={channel.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate font-black">{channel.name}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">{channel.description}</span>
                          </span>
                          <Play className="mr-auto text-sky" />
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-muted-foreground">لم نجد قناة مطابقة ضمن القنوات المتاحة حاليًا.</p>
                  )}
                </div>
              )}
            </form>
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
                  src={`https://www.youtube.com/embed/${selected.youtubeId}?rel=0&playsinline=1`}
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
                          playChannel(channel);
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