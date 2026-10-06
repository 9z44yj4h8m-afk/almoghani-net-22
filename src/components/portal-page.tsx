import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowUpLeft,
  Baby,
  Clapperboard,
  Film,
  Home,
  ListVideo,
  MessageCircle,
  MoonStar,
  Newspaper,
  Play,
  Search,
  Signal,
  Sparkles,
  Trophy,
  Tv,
  WandSparkles,
  type LucideIcon,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { type FormEvent, startTransition, useEffect, useState } from "react";
import { markActive, useInactiveChannels } from "@/lib/inactive-channels";

import satelliteMark from "@/assets/satellite-mark.jpg";
import satelliteWorld from "@/assets/satellite-world.jpg";
import { InstallAppButton } from "@/components/install-app-button";
import { BroadcastHero } from "@/components/broadcast-hero";
import { Button } from "@/components/ui/button";
import { searchChannelsWithAi } from "@/lib/channel-search.functions";
import { type Channel, type ChannelCategory } from "@/lib/channels";
import { LiveChat } from "@/components/live-chat";
import { useCatalog, useSiteConfig, defaultTexts } from "@/lib/site-config";
import { Lock } from "lucide-react";

const sections: {
  slug: string;
  title: string;
  category: ChannelCategory;
  icon: LucideIcon;
  cols: string;
}[] = [
  { slug: "news", title: "الإخبارية", category: "إخبارية" as ChannelCategory, icon: Newspaper, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "sports", title: "الرياضية", category: "رياضية" as ChannelCategory, icon: Trophy, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "islamic", title: "الإسلامية", category: "إسلامية" as ChannelCategory, icon: MoonStar, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "movies", title: "أفلام كاملة", category: "أفلام كاملة" as ChannelCategory, icon: Film, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "series", title: "المسلسلات والأفلام", category: "مسلسلات وأفلام" as ChannelCategory, icon: Clapperboard, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "kids", title: "أطفال ووثائقي", category: "أطفال ووثائقي" as ChannelCategory, icon: Baby, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "general", title: "عامة", category: "عامة" as ChannelCategory, icon: Tv, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
];

export const liveSections = sections;


const privateLibrarySections = [
  { kind: "live", name: "البث المباشر", description: "جميع القنوات مرتبة داخل تصنيفات واضحة", Icon: Tv, imageChannelId: "saudi-sports" },
  { kind: "movie", name: "الأفلام", description: "مكتبة أفلام عربية وعالمية في مكان واحد", Icon: Film, imageChannelId: "ar-aflam" },
  { kind: "series", name: "المسلسلات", description: "المواسم والحلقات مجمعة حسب عنوان المسلسل", Icon: Clapperboard, imageChannelId: "mbc-drama" },
] as const;

export function PortalPage({ section }: { section?: string }) {
  const channels = useCatalog();
  const { data: siteConfig } = useSiteConfig();
  const texts = siteConfig?.texts ?? defaultTexts;
  const bannerImage = siteConfig?.design.background?.startsWith("https://") ? siteConfig.design.background : satelliteWorld;
  const visibleSections = section ? sections.filter((s) => s.slug === section) : sections;
  const [selected, setSelected] = useState(
    channels.find((c) => c.category === visibleSections[0]?.category) ?? channels[0],
  );
  const [playerActive, setPlayerActive] = useState(Boolean(section));
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("channel");
    const found = id && channels.find((c) => c.id === id);
    if (found) { setPlayerActive(true); setSelected(found); document.getElementById("player")?.scrollIntoView({ behavior: "smooth" }); }
  }, []);
  const searchWithAi = useServerFn(searchChannelsWithAi);
  const navigate = useNavigate();
  function goBack() {
    // Always return to the home page: browser history is unreliable here
    // (section chips add #hash entries, and direct/installed-app opens have no previous page).
    navigate({ to: "/" });
  }
  const inactiveIds = useInactiveChannels();
  const inactiveChannels = channels.filter((c) => inactiveIds.includes(c.id));

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

  // Warm up a channel before the tap lands: open the connection to its stream host
  // so the player starts faster once the channel is selected.
  function warmChannel(channel: Channel) {
    const w = window as unknown as { __warmed?: Set<string> };
    w.__warmed ??= new Set();
    if (w.__warmed.has(channel.id)) return;
    w.__warmed.add(channel.id);
    try {
      const url = channel.streamUrl ?? "https://www.youtube.com";
      const origin = new URL(url).origin;
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
      if (channel.streamUrl) {
        fetch(channel.streamUrl, { mode: "cors", referrerPolicy: "no-referrer", cache: "force-cache" }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }

  function playChannel(channel: Channel) {
    // Scroll first (instant feedback), then swap the stream at lower priority so taps feel immediate.
    document.getElementById("player")?.scrollIntoView({ behavior: "auto", block: "start" });
    setSearchOpen(false);
    setPlayerActive(true);
    startTransition(() => setSelected(channel));
  }

  if (!selected) return null;
  const previewMode = !section;
  const heroTitle = section === "live" || !section ? "القنوات المباشرة" : `قنوات ${visibleSections[0]?.title ?? ""} مباشرة`;

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {section && (
              <button
                type="button"
                onClick={goBack}
                className="icon-button shrink-0"
                aria-label="رجوع"
                title="رجوع"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <a href="#player" className="flex min-w-0 shrink-0 items-center gap-3" aria-label="ALMOGHANI">
            <img src={satelliteMark} alt="" width={1024} height={1024} className="h-10 w-10 shrink-0 rounded-md border border-primary/50 object-cover" />
                        <span className="min-w-0 text-center">
              <span className="block font-display text-base font-black text-foreground sm:text-lg">ALMOGHANI</span>
              <span className="block truncate text-[10px] font-bold text-sky sm:text-xs">البث المباشر</span>
            </span>
          </a>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <nav className="ml-3 hidden items-center gap-6 text-sm font-bold text-muted-foreground md:flex">
              <Link to="/" className="border-b-2 border-primary py-2 text-primary">الرئيسية</Link>
              <Link to="/contact" className="transition-colors hover:text-sky">للتواصل</Link>
              <Link to="/subscription" className="text-primary transition-colors hover:text-sky">الاشتراك</Link>
              <Link to="/vip" search={{ kind: "live" }} className="text-sky transition-colors hover:text-primary">almoghani smarter</Link>
              <Link to="/live" className="transition-colors hover:text-sky">البث المباشر</Link>
            </nav>
            <Button
              variant="ghost" size="icon"
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
            </Button>
            <Button asChild variant="broadcast" size="sm" className="rounded-full px-4 font-bold"><Link to="/auth">تسجيل الدخول</Link></Button>
            <InstallAppButton />
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
                          <img src={channel.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded-md object-contain" />
                          <span className="min-w-0">
                            <span className="block truncate font-black">{channel.name}</span>
                            <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">{channel.description}</span>
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

      <main className="pb-28 md:pb-12">
        <BroadcastHero channel={selected} active={playerActive} onWatch={() => setPlayerActive(true)} sectionTitle={section ? heroTitle : undefined} />
        {!section && <LiveChat />}

        {previewMode && (
          <section className="bg-vip-background pb-10 text-vip-foreground sm:pb-14" aria-labelledby="private-library-title">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
              <div className="mb-4 flex items-end justify-between gap-3 border-t border-vip-foreground/10 pt-8">
                <div>
                  <p className="font-display text-xs font-extrabold text-vip-cyan" dir="ltr">{texts.proLabel}</p>
                  <h2 id="private-library-title" className="mt-1 font-display text-xl font-black sm:text-3xl">المكتبة الخاصة</h2>
                </div>
                <Lock className="h-5 w-5 text-vip-cyan" aria-label="مكتبة الأعضاء" />
              </div>
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">
              {privateLibrarySections.map(({ kind, name, description, Icon, imageChannelId }) => {
                const image = channels.find((channel) => channel.id === imageChannelId)?.thumbnail;
                return (
                <a
                  key={kind}
                  href={`/vip?kind=${kind}`}
                  className="private-library-card group"
                >
                  {image && <img src={image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-300 group-hover:scale-105" />}
                  <span className="absolute inset-0 bg-[linear-gradient(to_left,var(--vip-background),color-mix(in_oklab,var(--vip-background)_72%,transparent),color-mix(in_oklab,var(--vip-purple)_18%,transparent))]" />
                  <span className="relative flex min-h-[10.5rem] flex-col justify-between p-5">
                    <span className="flex items-start justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-md bg-vip-purple text-vip-foreground"><Icon className="h-5 w-5" /></span>
                      <ArrowUpLeft className="h-5 w-5 text-vip-cyan transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                    </span>
                    <span>
                      <span className="block font-display text-xl font-black">{name}</span>
                      <span className="mt-1 block text-xs font-semibold text-vip-foreground/65">{description}</span>
                    </span>
                  </span>
                </a>
                );
              })}
              </div>
            </div>
          </section>
        )}
        <div id="channels" className="mx-auto max-w-7xl space-y-10 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          {inactiveChannels.length > 0 && (
            <details className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-black">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                قنوات غير نشطة ({inactiveChannels.length})
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {inactiveChannels.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.category}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        markActive(c.id);
                        playChannel(c);
                      }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      تحديث الرابط
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <section className="smarter-banner relative isolate overflow-hidden border-y border-primary/50" aria-labelledby="smarter-banner-title">
            <img src={bannerImage} alt="أقمار صناعية ودش ورسيفر وتلفزيونات" width={1536} height={1024} loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
            <div className="smarter-banner-shade absolute inset-0 -z-10" />
            <Link
              to="/featured"
              className="group flex min-h-64 flex-col items-start justify-center gap-5 px-6 py-9 sm:min-h-72 sm:px-12"
              aria-label="الدخول إلى قسم القنوات المميزة"
            >
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs font-black text-accent"><Signal className="h-4 w-4" />almoghani.net</p>
                <h2 id="smarter-banner-title" dir="ltr" className="font-display text-4xl font-black leading-[1.05] sm:text-6xl">{texts.bannerTitle}</h2>
                <p className="mt-3 text-2xl font-black text-foreground sm:text-3xl">{texts.bannerSubtitle}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky/50 bg-sky/10 px-4 py-2 text-sm font-black text-sky">
                  <Sparkles className="h-4 w-4" />
                  القنوات المميزة
                  <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>
            </Link>
            <Link to="/contact" className="absolute bottom-4 left-4 rounded-full border border-primary/50 bg-background/70 px-4 py-2 text-xs font-black text-primary">للتواصل</Link>
          </section>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible" aria-label="الأقسام">
            {sections.map((s, i) => {
              const count = channels.filter((c) => c.category === s.category).length;
              return (
                <a
                  key={s.slug}
                  href={`#section-${i}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-sky hover:text-sky"
                >
                  <s.icon className="h-4 w-4 shrink-0 text-sky" />
                  <span className="whitespace-nowrap">{s.title}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">{count}</span>
                </a>
              );
            })}
          </div>
          {visibleSections.map((section, index) => {
            const sectionChannels = channels.filter((channel) => channel.category === section.category);
            const previewChannels = previewMode ? sectionChannels.slice(0, 8) : sectionChannels;
            const hiddenCount = sectionChannels.length - previewChannels.length;
            return (
              <section id={`section-${index}`} key={section.title} className="scroll-mt-28 border-t border-border/60 pt-9 first:border-t-0 first:pt-0 sm:pt-12">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky/40 bg-secondary text-sky sm:h-12 sm:w-12">
                      <section.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-black sm:text-2xl">{section.title}</h2>
                      <p className="truncate text-xs font-bold text-muted-foreground sm:text-sm">
                        {sectionChannels.length ? `${sectionChannels.length} قناة مباشرة` : "قريبًا"}
                      </p>
                    </div>
                  </div>
                  {previewMode && sectionChannels.length > 8 && (
                    <Link
                      to="/channels/$section"
                      params={{ section: section.slug }}
                      className="shrink-0 rounded-full border border-primary/70 px-4 py-2 text-xs font-black text-sky transition-colors hover:bg-primary/10"
                    >
                      عرض الكل
                    </Link>
                  )}
                  {section.slug === "movies" && (
                    <Link
                      to="/vip"
                      search={{ kind: "live" }}
                      className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground"
                    >
                      almoghani smarter
                    </Link>
                  )}
                </div>

                {sectionChannels.length ? (
                  <>
                    <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${section.cols}`}>
                      {previewChannels.map((channel, i) => (
                      <button
                        key={channel.id}
                        type="button"
                        onPointerEnter={() => warmChannel(channel)}
                        onTouchStart={() => warmChannel(channel)}
                        onFocus={() => warmChannel(channel)}
                        onClick={() => {
                          playChannel(channel);
                        }}
                        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 220px" }}
                        className={`channel-card ${selected.id === channel.id ? "channel-card-active" : ""}`}
                      >
                        <span className="relative block aspect-video overflow-hidden bg-surface-deep">
                          <span className="absolute inset-0 animate-pulse bg-muted/40" aria-hidden />
                          <img
                            loading={index === 0 && i < 4 ? "eager" : "lazy"}
                            fetchPriority={index === 0 && i < 4 ? "high" : "low"}
                            decoding="async"
                            width={320}
                            height={180}
                            onLoad={(e) => (e.currentTarget.previousElementSibling as HTMLElement | null)?.remove()}
                            className={`relative h-full w-full transition-transform duration-500 ${channel.streamUrl ? "object-contain p-4" : "object-cover group-hover:scale-105"}`}
                            src={channel.thumbnail}
                            alt={`صورة ${channel.name}`}
                          />
                          <span className="absolute inset-0 bg-player-overlay" />
                          <span className="absolute left-2 top-2 live-badge px-2 py-0.5 text-[9px] sm:left-3 sm:top-3 sm:text-[10px]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
                            {selected.id === channel.id ? "يُعرض الآن" : "LIVE"}
                          </span>
                          <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-live">
                              <Play className="h-5 w-5 fill-current" />
                            </span>
                          </span>
                        </span>
                        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2 text-right sm:gap-3 sm:p-4">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold sm:text-base">{channel.name}</span>
                            <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">{channel.description}</span>
                          </span>
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-sky text-foreground sm:h-9 sm:w-9"><Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" /></span>
                        </span>
                      </button>
                     ))}
                    </div>
                    {hiddenCount > 0 && (
                      <Link
                        to="/channels/$section"
                        params={{ section: section.slug }}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-black text-sky transition-colors hover:border-sky hover:bg-primary/5"
                      >
                        <ListVideo className="h-4 w-4" />
                        عرض كل قنوات {section.title} ({sectionChannels.length})
                      </Link>
                    )}
                  </>
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

      <Link
        to="/chat"
        className="fixed bottom-6 left-4 z-40 hidden items-center gap-2 rounded-full border border-primary/70 bg-gradient-to-l from-primary to-primary/80 px-4 py-3 font-display text-sm font-black text-primary-foreground shadow-live transition-transform hover:-translate-y-0.5 md:flex"
      >
        <MessageCircle className="h-5 w-5" />ALMOGHANI AI
      </Link>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-5 items-end border-t border-border bg-background/95 px-2 pb-2 backdrop-blur-xl md:hidden" aria-label="التنقل السريع">
        <a href="#player" className="mobile-nav-item text-primary"><Home className="h-5 w-5" /><span>البث</span></a>
        <Link to="/movies" className="mobile-nav-item"><Film className="h-5 w-5" /><span>أفلام</span></Link>
        <a href="#player" className="relative -top-5 mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-live" aria-label="شغّل البث">
          <Play className="h-6 w-6 fill-current" />
        </a>
        <Link to="/chat" className="mobile-nav-item"><MessageCircle className="h-5 w-5" /><span>المحادثة</span></Link>
        <Link to="/contact" className="mobile-nav-item"><MessageCircle className="h-5 w-5" /><span>للتواصل</span></Link>
      </nav>
    </div>
  );
}
