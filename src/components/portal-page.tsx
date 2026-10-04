import { Link } from "@tanstack/react-router";
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
import { type FormEvent, useEffect, useState } from "react";

import kaabaEmblem from "@/assets/kaaba-emblem.jpg";
import quranIcon from "@/assets/quran-icon.jpg";
import { Button } from "@/components/ui/button";
import { searchChannelsWithAi } from "@/lib/channel-search.functions";
import { channels, type Channel } from "@/lib/channels";


const sections = [
  { slug: "sports", title: "الرياضية", category: "رياضية" as const, cols: "md:grid-cols-3 xl:grid-cols-3" },
  { slug: "islamic", title: "الإسلامية", category: "إسلامية" as const, cols: "md:grid-cols-2 xl:grid-cols-2" },
  { slug: "news", title: "الإخبارية", category: "إخبارية" as const, cols: "md:grid-cols-3 xl:grid-cols-4" },
  { slug: "series", title: "المسلسلات والأفلام", category: "مسلسلات وأفلام" as const, cols: "md:grid-cols-2 xl:grid-cols-4" },
];

const portalLinks = [
  { title: "سيرة الرسول ﷺ", Icon: Moon },
  { title: "الأحاديث الشريفة", Icon: ScrollText },
  { title: "أمهات المؤمنين رضي الله عنهن", Icon: Heart },
  { title: "سير الصحابة رضي الله عنهم", Icon: Users },
  { title: "أذكار الصباح والمساء", Icon: Sunrise },
  { title: "أجور عظيمة من أذكار يسيرة", Icon: Gem },
];

export const liveSections = sections;

export function PortalPage({ live = false, section }: { live?: boolean; section?: string }) {
  const visibleSections = section ? sections.filter((s) => s.slug === section) : sections;
  const [selected, setSelected] = useState(
    channels.find((c) => c.category === visibleSections[0]?.category) ?? channels[0],
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("channel");
    if (!live && id) { window.location.replace(`/live?channel=${encodeURIComponent(id)}`); return; }
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
              <a className="text-foreground transition-colors hover:text-sky" href="/">الرئيسية</a>
              {sections.map((s) => (
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
        <nav className="no-scrollbar flex gap-2 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {sections.map((s) => (
            <Link key={s.slug} to="/channels/$section" params={{ section: s.slug }} className={`category-pill shrink-0 ${section === s.slug ? "category-pill-active" : ""}`}>{s.title}</Link>
          ))}
        </nav>
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

      <main className="pb-24 md:pb-12">
        {!live && (<section id="home" className="mx-auto max-w-3xl space-y-3 px-4 pt-4">
          <div className="relative grid grid-cols-[1fr_auto] items-center gap-4 py-2">
            <div className="portal-frame grid h-24 place-items-center sm:h-32">
              <span className="portal-wordmark text-3xl sm:text-5xl">ALMOGHANI</span>
            </div>
            <img src={kaabaEmblem} alt="الكعبة المشرفة" width={816} height={816} className="h-24 w-24 rounded-3xl object-cover sm:h-32 sm:w-32" />
          </div>

          <Link to="/quran" className="portal-frame flex items-center gap-4 p-4 sm:p-6">
            <img src={quranIcon} alt="" loading="lazy" width={816} height={816} className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20" />
            <span className="flex-1 text-center">
              <span className="block text-2xl font-black sm:text-3xl">القرآن الكريم</span>
              <span className="mx-auto mt-2 block h-0.5 w-14 bg-primary" />
            </span>
          </Link>

          <Link to="/live" className="portal-frame flex items-center gap-4 p-4 sm:p-6">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-live/20 text-signal sm:h-20 sm:w-20"><Play className="h-8 w-8 fill-current" /></span>
            <span className="flex-1 text-center">
              <span className="block text-2xl font-black sm:text-3xl">البث</span>
              <span className="mx-auto mt-2 block h-0.5 w-14 bg-primary" />
            </span>
          </Link>

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
        </section>)}

        {live && (<>
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

        <section id="categories" className={`${section ? "hidden md:block " : ""}border-b border-border/60 bg-surface/40 py-4`}>
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {sections.map((s) => (
              <Link
                key={s.slug}
                to="/channels/$section"
                params={{ section: s.slug }}
                className={`category-pill ${s.slug === section ? "category-pill-active" : ""}`}
              >
                {s.title}
              </Link>
            ))}
          </div>
        </section>

        <div id="channels" className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {visibleSections.map((section, index) => {
            const sectionChannels = channels.filter((channel) => channel.category === section.category);
            return (
              <section id={`section-${index}`} key={section.title} className="scroll-mt-28">
                <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-5 w-1 shrink-0 rounded-full ${sectionChannels.length ? "bg-signal" : "bg-sky"}`} />
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
                          <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={channel.thumbnail} alt={`صورة ${channel.name}`} />
                          <span className="absolute inset-0 bg-player-overlay" />
                          <span className="absolute left-2 top-2 live-badge px-2 py-0.5 text-[9px] sm:left-3 sm:top-3 sm:text-[10px]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
                            {selected.id === channel.id ? "يُعرض الآن" : "LIVE"}
                          </span>
                          <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-signal text-live-foreground shadow-live">
                              <Play className="h-5 w-5 fill-current" />
                            </span>
                          </span>
                        </span>
                        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2.5 text-right sm:gap-3 sm:p-4">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold sm:text-base">{channel.name}</span>
                            <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">{channel.description}</span>
                          </span>
                          <CirclePlay className="h-5 w-5 shrink-0 text-sky sm:h-6 sm:w-6" />
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

        </>)}

        {!live && (<section id="contact" className="mx-auto max-w-3xl space-y-5 px-4 pb-6">
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
        </section>)}
      </main>

      <Link
        to="/chat"
        className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-full border border-primary/70 bg-gradient-to-l from-primary to-sky/80 px-4 py-3 font-display text-sm font-black text-primary-foreground shadow-live transition-transform hover:-translate-y-0.5 md:bottom-6"
      >
        <MessageCircle className="h-5 w-5" />ALMOGHANI AI
      </Link>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-3 border-t border-border bg-background/95 px-6 backdrop-blur-xl md:hidden" aria-label="التنقل السريع">
        <a href={live ? "/" : "#home"} className="mobile-nav-item text-signal"><Home className="h-5 w-5" /><span>الرئيسية</span></a>
        <a href={live ? "#channels" : "/live"} className="mobile-nav-item"><ListVideo className="h-5 w-5" /><span>القنوات</span></a>
        <a href={live ? "#player" : "/live"} className="relative -top-4 mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-live text-live-foreground shadow-live" aria-label="شغّل البث">
          <Play className="h-6 w-6 fill-current" />
        </a>
      </nav>
    </div>
  );
}