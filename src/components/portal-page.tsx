import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Home,
  ListVideo,
  MessageCircle,
  Play,
  Search,
  Signal,
  Sparkles,
  Volume2,
  WandSparkles,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";

import kaabaEmblem from "@/assets/kaaba-emblem.jpg";
import mosqueBg from "@/assets/mosque-bg.png.asset.json";
import riyadhBg from "@/assets/riyadh-bg.png.asset.json";
import { Button } from "@/components/ui/button";
import { searchChannelsWithAi } from "@/lib/channel-search.functions";
import { channels, type Channel, type ChannelCategory } from "@/lib/channels";

const sections = [
  { slug: "news", title: "الإخبارية", category: "إخبارية" as ChannelCategory, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "sports", title: "الرياضية", category: "رياضية" as ChannelCategory, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "islamic", title: "الإسلامية", category: "إسلامية" as ChannelCategory, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "series", title: "المسلسلات والأفلام", category: "مسلسلات وأفلام" as ChannelCategory, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "kids", title: "أطفال ووثائقي", category: "أطفال ووثائقي" as ChannelCategory, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
  { slug: "general", title: "عامة", category: "عامة" as ChannelCategory, cols: "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" },
];

export const liveSections = sections;

function LivePlayer({ channel }: { channel: Channel }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hlsFailed, setHlsFailed] = useState(false);

  useEffect(() => {
    if (!channel.streamUrl) return;
    setHlsFailed(false);
    let destroyed = false;
    let hls: Hls | undefined;
    import("hls.js")
      .then(({ default: HlsCtor }) => {
        const video = videoRef.current;
        if (destroyed || !video) return;
        if (HlsCtor.isSupported()) {
          hls = new HlsCtor({ enableWorker: false, maxBufferLength: 30 });
          hls.on(HlsCtor.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
              hls?.startLoad();
            } else if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
              hls?.recoverMediaError();
            } else {
              hls?.destroy();
              setHlsFailed(true);
            }
          });
          hls.loadSource(channel.streamUrl!);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = channel.streamUrl!;
        }
      })
      .catch((error) => {
        console.warn("HLS load failed:", error);
        setHlsFailed(true);
      });
    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [channel]);

  if (channel.streamUrl) {
    return hlsFailed ? (
      <div className="grid h-full w-full place-items-center bg-surface-deep p-6 text-center">
        <div>
          <p className="font-display text-lg font-black">تعذّر تشغيل هذا البث على هذا المتصفح</p>
          <p className="mt-2 text-sm text-muted-foreground">جرّب متصفحًا آخر مثل كروم أو سفاري، أو اختر قناة أخرى من الأسفل.</p>
        </div>
      </div>
    ) : (
      <video ref={videoRef} className="h-full w-full bg-black" controls autoPlay playsInline />
    );
  }
  return (
    <iframe
      className="h-full w-full"
      src={`https://www.youtube.com/embed/${channel.youtubeId}?rel=0&playsinline=1`}
      title={`البث المباشر — ${channel.name}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

export function PortalPage({ section }: { section?: string }) {
  const visibleSections = section ? sections.filter((s) => s.slug === section) : sections;
  const [selected, setSelected] = useState(
    channels.find((c) => c.category === visibleSections[0]?.category) ?? channels[0],
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("channel");
    const found = id && channels.find((c) => c.id === id);
    if (found) { setSelected(found); document.getElementById("player")?.scrollIntoView({ behavior: "smooth" }); }
  }, []);
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
  const heroTitle = section === "live" || !section ? "القنوات المباشرة" : `قنوات ${visibleSections[0]?.title ?? ""} مباشرة`;
  const heroSub = section === "islamic" ? "تلاوات وبرامج إيمانية على مدار الساعة" : "تابع القنوات المباشرة من مكان واحد";

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <a href="#player" className="flex min-w-0 items-center gap-3" aria-label="ALMOGHANI">
            <img src={kaabaEmblem} alt="" width={816} height={816} className="h-11 w-11 shrink-0 rounded-full border border-primary object-cover" />
            <span className="h-9 w-px bg-border" />
            <span className="min-w-0 text-center">
              <span className="block font-display text-xs font-bold text-foreground underline decoration-primary underline-offset-4">almoghani.net</span>
              <span className="block truncate text-sm font-bold text-muted-foreground sm:text-base">صفحة شخصية من اجتهادي</span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            <nav className="ml-3 hidden items-center gap-6 text-sm font-bold text-muted-foreground md:flex">
              <Link to="/quran" className="transition-colors hover:text-sky">القرآن الكريم</Link>
              {sections.length > 1 && sections.map((s) => (
                <Link key={s.slug} to="/channels/$section" params={{ section: s.slug }} className="transition-colors hover:text-sky" activeProps={{ className: "text-sky" }}>{s.title}</Link>
              ))}
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
        <section id="player" className="relative border-b border-border/60">
          <div className="hero-scene" style={{ backgroundImage: `url(${section === "islamic" ? mosqueBg.url : riyadhBg.url})` }} aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
            <div className="mb-4 text-center sm:mb-7">
              <h1 className="gold-title font-display text-2xl font-black leading-tight sm:text-5xl">{heroTitle}</h1>
              <p className="mt-2 text-sm font-bold text-foreground/90 sm:text-lg">{heroSub}</p>
            </div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-display text-base font-black sm:text-xl">{selected.name}</p>
              <div className="live-badge shrink-0">
                <span className="h-2 w-2 rounded-full bg-live-foreground animate-live-pulse" />
                LIVE
              </div>
            </div>
            <div className="player-shell animate-fade-up rounded-xl border-sky/60">
              <div className="aspect-video w-full overflow-hidden bg-surface-deep">
                <LivePlayer channel={selected} />
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

        <div id="channels" className="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          {visibleSections.map((section, index) => {
            const sectionChannels = channels.filter((channel) => channel.category === section.category);
            return (
              <section id={`section-${index}`} key={section.title} className="scroll-mt-24">
                <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-5 w-1 shrink-0 rounded-full ${sectionChannels.length ? "bg-primary" : "bg-sky"}`} />
                    <h2 className="truncate font-display text-base font-black sm:text-xl">{section.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground sm:text-xs">
                    {sectionChannels.length ? `${sectionChannels.length} قناة` : "قريبًا"}
                  </span>
                </div>

                {sectionChannels.length ? (
                  <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${section.cols}`}>
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
                          <img className={`h-full w-full transition-transform duration-500 ${channel.streamUrl ? "object-contain p-4" : "object-cover group-hover:scale-105"}`} src={channel.thumbnail} alt={`صورة ${channel.name}`} />
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
        <a href="#channels" className="mobile-nav-item"><ListVideo className="h-5 w-5" /><span>القنوات</span></a>
        <a href="#player" className="relative -top-5 mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-live" aria-label="شغّل البث">
          <Play className="h-6 w-6 fill-current" />
        </a>
        <Link to="/chat" className="mobile-nav-item"><MessageCircle className="h-5 w-5" /><span>المحادثة</span></Link>
        <Link to="/quran" className="mobile-nav-item"><Sparkles className="h-5 w-5" /><span>القرآن</span></Link>
      </nav>
    </div>
  );
}
