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
import { InstallAppButton } from "@/components/install-app-button";
import { BroadcastWordmark } from "@/components/broadcast-shell";
import { BroadcastHero } from "@/components/broadcast-hero";
import { BreakingTicker } from "@/components/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { searchChannelsWithAi } from "@/lib/channel-search.functions";
import { type Channel, type ChannelCategory } from "@/lib/channels";
import { useCatalog, useSiteConfig, defaultTexts, defaultAd } from "@/lib/site-config";
import moviesAd from "@/assets/movies-ad.png.asset.json";
import { getSectionCard } from "@/lib/section-content";
import { SectionCardStyle } from "@/components/section-card-style";
import { Lock } from "lucide-react";
import { BedouinDramaBanner } from "@/components/bedouin-drama-banner";

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
  const configuredSections = sections.map((s) => ({ ...s, title: siteConfig?.sectionContent.titles[s.slug] || s.title }));
  const visibleSections = section ? configuredSections.filter((s) => s.slug === section) : configuredSections;
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
        <div className="broadcast-site-header">
          <Link to="/" aria-label="ALMOGHANI LIVE"><BroadcastWordmark /></Link>
          <Button variant="outline" onClick={() => { setSearchOpen(v => !v); setSearchError(""); }} className="broadcast-search-link" aria-label="بحث"><span>ابحث عن القنوات والبرامج…</span><Search /></Button>
          <Link to="/" className="broadcast-mini-brand"><BroadcastWordmark compact /></Link>
          {section && <Button variant="ghost" size="icon" onClick={goBack} aria-label="رجوع"><ArrowRight /></Button>}
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
        {!section && <BreakingTicker />}
        {!section && <HomeAd />}
        {!section && <section className="mx-auto max-w-4xl px-3 pt-5 sm:px-6" aria-label="البدوية دراما"><BedouinDramaBanner /></section>}


        {previewMode && (
          <section className="broadcast-destinations" aria-label="أقسام سمارتر">
            {privateLibrarySections.map(({ kind }, index) => {
              const card = getSectionCard(`home-${kind}`, siteConfig?.sectionContent);
              return <a key={kind} href={card.link} data-section-card={`home-${kind}`} className="broadcast-destination group">
                <SectionCardStyle id={`home-${kind}`} card={card} />
                <img src={card.image} alt="" loading="lazy" width={1152} height={576} />
                {index !== 1 && <span className={`destination-badge ${index === 2 ? "destination-exclusive" : ""}`}>{index === 0 ? "مباشر" : "حصري"}</span>}
                <span className="destination-copy"><span data-card-text="title" className="destination-title">{card.title}<ArrowUpLeft /></span>{card.description && <span data-card-text="description" className="destination-description">{card.description}</span>}<span data-card-text="button" className="destination-enter">{card.button}</span></span>
              </a>;
            })}
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
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible" aria-label="الأقسام">
            {configuredSections.map((s, i) => {
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

    </div>
  );
}

function HomeAd() {
  const { data } = useSiteConfig();
  const ad = data?.ad ?? defaultAd;
  if (!ad.enabled) return null;
  const image = ad.image.startsWith("https://") ? ad.image : moviesAd.url;
  const img = <img src={image} alt="أفلام مميزة كاملة — شاهد الآن" width={1536} height={1024} loading="lazy" className="block w-full rounded-2xl border border-sky/50 shadow-xl transition-transform hover:scale-[1.01]" />;
  return (
    <section className="mx-auto max-w-4xl px-3 pt-5 sm:px-6" aria-label="إعلان">
      {/^https?:\/\//.test(ad.link) ? <a href={ad.link} target="_blank" rel="noopener noreferrer">{img}</a> : <a href={ad.link.startsWith("/") ? ad.link : "/movies"}>{img}</a>}
    </section>
  );
}
