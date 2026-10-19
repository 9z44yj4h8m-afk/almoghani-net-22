import { Link, useNavigate } from "@tanstack/react-router";
import { IptvWorkspace } from "@/components/iptv-workspace";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowUpLeft,
  Baby,
  Clapperboard,
  Film,
  Home,
  Heart,
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
import { useCatalog, useSiteConfig, defaultTexts, safeHttpsImage } from "@/lib/site-config";
import memberEntry from "@/assets/gold/member-entry.jpg";
import chatEntry from "@/assets/gold/chat-entry.jpg";
import { Lock } from "lucide-react";
import { BedouinDramaBanner } from "@/components/bedouin-drama-banner";
import { HomeCategoryBanners } from "@/components/home-category-banners";

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


export function PortalPage({ section, homepage = false }: { section?: string; homepage?: boolean }) {
  const channels = useCatalog();
  const { data: siteConfig } = useSiteConfig();
  const texts = siteConfig?.texts ?? defaultTexts;
  const configuredSections = sections.map((s) => ({ ...s, title: siteConfig?.sectionContent.titles[s.slug] || s.title }));
  const visibleSections = section ? configuredSections.filter((s) => s.slug === section) : configuredSections;
  const [selected, setSelected] = useState(
    channels.find((c) => c.category === visibleSections[0]?.category) ?? channels[0],
  );
  const [playerActive, setPlayerActive] = useState(!homepage);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => { try { const saved: unknown = JSON.parse(localStorage.getItem("almoghani-channel-favorites") ?? "[]"); if (Array.isArray(saved)) setFavorites(saved.filter((id): id is string => typeof id === "string")); } catch { /* Keep empty favorites when storage is unavailable. */ } }, []);
  function toggleFavorite(id: string) { setFavorites((current) => { const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id]; try { localStorage.setItem("almoghani-channel-favorites", JSON.stringify(next)); } catch { /* Favorites still work for this visit. */ } return next; }); }
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("channel");
    const found = id && channels.find((c) => c.id === id);
    if (found) { setPlayerActive(true); setSelected(found); document.getElementById("player")?.scrollIntoView({ behavior: "smooth" }); }
  }, []);
  // Auto-fallback: when a channel fails, switch to a similar one from the same section.
  const [fallbackNote, setFallbackNote] = useState("");
  useEffect(() => {
    const tried = new Set<string>();
    const onFailed = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      tried.add(id);
      const failed = channels.find((c) => c.id === id);
      if (!failed) return;
      const inactive = new Set<string>(JSON.parse(localStorage.getItem("almoghani-inactive-channels") ?? "[]"));
      const pool = channels.filter((c) => !tried.has(c.id) && !inactive.has(c.id));
      const words = failed.name.split(/\s+/).filter((w) => w.length > 1);
      const next =
        pool.find((c) => c.category === failed.category && words.some((w) => c.name.includes(w))) ??
        pool.find((c) => c.category === failed.category && Boolean(c.streamUrl) === Boolean(failed.streamUrl)) ??
        pool.find((c) => c.category === failed.category);
      if (!next) return;
      setFallbackNote(`تعطّل بث «${failed.name}» — نقلناك تلقائيًا إلى «${next.name}»`);
      window.setTimeout(() => setFallbackNote(""), 7000);
      startTransition(() => setSelected(next));
    };
    window.addEventListener("almoghani:channel-failed", onFailed);
    return () => window.removeEventListener("almoghani:channel-failed", onFailed);
  }, [channels]);
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
  const previewMode = homepage;
  const heroTitle = section === "live" || !section ? "القنوات المباشرة" : `قنوات ${visibleSections[0]?.title ?? ""} مباشرة`;

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="broadcast-site-header">
          <Link to="/" aria-label="ALMOGHANI LIVE"><BroadcastWordmark /></Link>
          <Button variant="outline" onClick={() => { setSearchOpen(v => !v); setSearchError(""); }} className="broadcast-search-link" aria-label="بحث"><span>ابحث عن القنوات والبرامج…</span><Search /></Button>
          {homepage ? <Button asChild variant="broadcast" className="home-chat-entry"><Link to="/chat"><MessageCircle />الدردشة</Link></Button> : <Link to="/" className="broadcast-mini-brand"><BroadcastWordmark compact /></Link>}
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
                    placeholder="اكتب اسم القناة مثل MBC أو الجزيرة"
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

              {!searchResults && searchQuery.trim().length >= 2 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {channels.filter((c) => c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 12).map((channel) => (
                    <Button key={channel.id} type="button" variant="secondary" onClick={() => playChannel(channel)} className="h-auto min-w-0 justify-start whitespace-normal p-3 text-right">
                      <img src={channel.thumbnail} alt="" className="h-10 w-16 shrink-0 rounded-md object-contain" />
                      <span className="min-w-0 truncate font-black">{channel.name}</span>
                      <Play className="mr-auto text-sky" />
                    </Button>
                  ))}
                </div>
              )}

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
        {fallbackNote && <div role="status" className="mx-auto max-w-7xl px-4 pt-3 text-center text-sm font-bold text-signal">{fallbackNote}</div>}
        <IptvWorkspace channels={channels} sections={configuredSections} selected={selected} active={playerActive} onWatch={() => setPlayerActive(true)} onSelect={playChannel} favorites={favorites} onFavorite={toggleFavorite} initialSection={section} />
        {inactiveChannels.length > 0 && <details className="mx-3 my-3 border-y border-border py-3"><summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><WifiOff className="h-4 w-4" />قنوات غير نشطة ({inactiveChannels.length})</summary><div className="mt-3 flex flex-wrap gap-2">{inactiveChannels.map((channel, index) => <Button key={`${channel.id}-${index}`} variant="outline" onClick={() => { markActive(channel.id); playChannel(channel); }}><RefreshCw className="h-4 w-4" />{channel.name}</Button>)}</div></details>}



      </main>

    </div>
  );
}

function HomeEntries() {
  const { data: siteConfig } = useSiteConfig();
  return <section className="mx-auto grid max-w-4xl gap-3 px-3 pt-5 sm:px-6" aria-label="الأعضاء والمساعد الذكي">
    <Link to="/auth" aria-label="دخول الأعضاء" className="design-gleam block overflow-hidden rounded-lg border border-sky/50"><img src={memberEntry} alt="دخول الأعضاء — تسجيل الدخول" width={1920} height={712} className="block h-auto w-full" /></Link>
    <Link to="/chat" aria-label="Chat ALMOGHANI AI" className="design-gleam block overflow-hidden rounded-lg border border-sky/50"><img src={safeHttpsImage(siteConfig?.texts.chatImage) || chatEntry} alt="Chat ALMOGHANI AI — ابدأ المحادثة" width={1920} height={712} loading="lazy" className="block h-auto w-full" /></Link>
  </section>;
}
