import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  ChevronLeft,
  CirclePlay,
  Copy,
  Gem,
  Ghost,
  Heart,
  Home,
  Instagram,
  ListVideo,
  MessageCircle,
  Moon,
  Play,
  ScrollText,
  Search,
  Signal,
  Sparkles,
  Sunrise,
  Users,
  WandSparkles,
  Volume2,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import kaabaEmblem from "@/assets/kaaba-emblem.jpg";
import quranIcon from "@/assets/quran-icon.jpg";
import { Button } from "@/components/ui/button";
import { searchChannelsWithAi } from "@/lib/channel-search.functions";

type Channel = {
  id: string;
  name: string;
  category: "سعودية" | "رياضية" | "إسلامية" | "إخبارية" | "مسلسلات وأفلام";
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
  {
    id: "saudi-sports",
    name: "القناة الرياضية السعودية",
    category: "رياضية",
    youtubeId: "TK1XWtPXj6w",
    thumbnail: "https://i.ytimg.com/vi/TK1XWtPXj6w/hqdefault.jpg",
    description: "القناة الرياضية السعودية الأولى — بث مباشر",
  },
  {
    id: "bein-sports",
    name: "beIN SPORTS",
    category: "رياضية",
    youtubeId: "ekMxMIexsJ8",
    thumbnail: "https://i.ytimg.com/vi/ekMxMIexsJ8/hqdefault.jpg",
    description: "بث مباشر من بي إن سبورتس",
  },
  {
    id: "bein-news",
    name: "beIN SPORTS الإخبارية",
    category: "إخبارية",
    youtubeId: "2lJZPT6OljI",
    thumbnail: "https://i.ytimg.com/vi/2lJZPT6OljI/hqdefault.jpg",
    description: "قناة بي إن سبورتس الإخبارية — بث مباشر",
  },
  {
    id: "asharq-bloomberg",
    name: "تلفزيون الشرق بلومبرغ",
    category: "إخبارية",
    youtubeId: "f6VpkfV7m4Y",
    thumbnail: "https://i.ytimg.com/vi/f6VpkfV7m4Y/hqdefault.jpg",
    description: "أخبار الاقتصاد والأسواق مباشرة",
  },
  {
    id: "sky-news-arabia",
    name: "سكاي نيوز عربية",
    category: "إخبارية",
    youtubeId: "ppgTP8xQQsM",
    thumbnail: "https://i.ytimg.com/vi/ppgTP8xQQsM/hqdefault.jpg",
    description: "البث المباشر لقناة سكاي نيوز عربية",
  },
  {
    id: "shabab-albomb",
    name: "مسلسل شباب البومب",
    category: "مسلسلات وأفلام",
    youtubeId: "Pj6ks4vaVG0",
    thumbnail: "https://i.ytimg.com/vi/Pj6ks4vaVG0/hqdefault.jpg",
    description: "بث مباشر لمسلسل شباب البومب — هلا بالعيال",
  },
  {
    id: "sen-anlat-karadeniz",
    name: "مسلسل البحر الأسود",
    category: "مسلسلات وأفلام",
    youtubeId: "tW_78_pmCo4",
    thumbnail: "https://i.ytimg.com/vi/tW_78_pmCo4/hqdefault.jpg",
    description: "بث مباشر لمسلسل البحر الأسود — Sen Anlat Karadeniz",
  },
];

const sections = [
  { title: "القنوات السعودية", category: "سعودية" as const },
  { title: "القنوات الرياضية", category: "رياضية" as const },
  { title: "القنوات الإسلامية", category: "إسلامية" as const },
  { title: "القنوات الإخبارية", category: "إخبارية" as const },
  { title: "المسلسلات والأفلام", category: "مسلسلات وأفلام" as const },
];

const portalLinks = [
  { title: "سيرة الرسول ﷺ", Icon: Moon },
  { title: "الأحاديث الشريفة", Icon: ScrollText },
  { title: "أمهات المؤمنين رضي الله عنهن", Icon: Heart },
  { title: "سير الصحابة رضي الله عنهم", Icon: Users },
  { title: "أذكار الصباح والمساء", Icon: Sunrise },
  { title: "أجور عظيمة من أذكار يسيرة", Icon: Gem },
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
  const [copied, setCopied] = useState(false);
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
          <a href="#home" className="flex min-w-0 items-center gap-3" aria-label="ALMOGHANI">
            <img src={kaabaEmblem} alt="" width={816} height={816} className="h-11 w-11 shrink-0 rounded-full border border-primary object-cover" />
            <span className="h-9 w-px bg-border" />
            <span className="min-w-0 text-center">
              <span className="block font-display text-xs font-bold text-foreground underline decoration-primary underline-offset-4">almoghani.net</span>
              <span className="block truncate text-sm font-bold text-muted-foreground sm:text-base">صفحة شخصية من اجتهادي</span>
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
        <section id="home" className="mx-auto max-w-3xl space-y-3 px-4 pt-4">
          <div className="portal-frame overflow-hidden p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-black">شاهد الآن | القنوات الإخبارية المباشرة</p>
              <a href="#player" className="rounded-md border border-sky/60 bg-sky/15 px-3 py-1 text-xs font-bold text-sky">المشغّل</a>
            </div>
            <div className="overflow-hidden">
              <div className="portal-ticker gap-8 text-xs text-muted-foreground">
                {[...channels, ...channels]
                  .filter((c) => c.category === "إخبارية")
                  .map((c, i) => (
                    <button key={`${c.id}-${i}`} type="button" onClick={() => playChannel(c)} className="flex shrink-0 items-center gap-2 hover:text-sky">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky" />{c.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-[1fr_auto] items-center gap-4 py-2">
            <div className="portal-frame grid h-24 place-items-center sm:h-32">
              <span className="portal-wordmark text-3xl sm:text-5xl">ALMOGHANI</span>
            </div>
            <img src={kaabaEmblem} alt="الكعبة المشرفة" width={816} height={816} className="h-24 w-24 rounded-3xl object-cover sm:h-32 sm:w-32" />
          </div>

          <a href="#section-2" className="portal-frame flex items-center gap-4 p-4 sm:p-6">
            <img src={quranIcon} alt="" loading="lazy" width={816} height={816} className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20" />
            <span className="flex-1 text-center">
              <span className="block text-2xl font-black sm:text-3xl">القرآن الكريم</span>
              <span className="mx-auto mt-2 block h-0.5 w-14 bg-primary" />
            </span>
          </a>

          <div className="grid grid-cols-2 gap-2.5">
            {portalLinks.map(({ title, Icon }) => (
              <button key={title} type="button" title="قريبًا" className="portal-frame flex min-h-16 items-center gap-3 p-3 text-right">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/25 text-sky"><Icon className="h-5 w-5" /></span>
                <span className="flex-1 text-sm font-black leading-snug sm:text-base">{title}</span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-primary" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setSearchOpen(true); setSearchError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="portal-frame flex w-full items-center justify-between px-4 py-3 text-muted-foreground"
          >
            ابحث داخل الموقع <Search className="h-4 w-4 text-sky" />
          </button>
        </section>

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

        <section id="contact" className="mx-auto max-w-3xl space-y-5 px-4 pb-6">
          <div className="portal-frame p-4 text-center sm:p-6">
            <h2 className="mb-4 flex items-center justify-center gap-3 font-black">
              <span className="h-px w-10 bg-primary" />للتواصل المباشر<span className="h-px w-10 bg-primary" />
            </h2>
            <div className="mb-4 flex items-center justify-center gap-3">
              <span dir="ltr" className="font-display text-lg font-bold">+966 557 073 007</span>
              <span className="h-6 w-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText("+966557073007");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="flex items-center gap-1.5 rounded-md border border-primary/60 px-3 py-1.5 text-sm font-bold transition-colors hover:border-sky"
              >
                <Copy className="h-4 w-4" />{copied ? "تم النسخ" : "نسخ"}
              </button>
            </div>
            <a
              href="https://wa.me/966557073007"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-primary/60 bg-gradient-to-l from-primary to-sky/70 py-3 font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="h-5 w-5" />تواصل الآن عبر الواتساب
            </a>
          </div>

          <h2 className="flex items-center justify-center gap-3 text-xl font-black">
            <span className="h-px w-12 bg-border" />للتواصل<span className="h-px w-12 bg-border" />
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "انستقرام", icon: <Instagram className="h-5 w-5" /> },
              { label: "إكس", icon: <span className="font-display text-lg font-black">𝕏</span> },
              { label: "سناب شات", icon: <Ghost className="h-5 w-5" /> },
            ].map((s) => (
              <span key={s.label} title={s.label} aria-label={s.label} className="portal-frame grid h-12 place-items-center text-foreground">
                {s.icon}
              </span>
            ))}
          </div>
          <p className="border-t border-border pt-4 text-center text-sm font-bold text-muted-foreground">
            جميع الحقوق محفوظة © 2026 · almoghani.net
          </p>
        </section>
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