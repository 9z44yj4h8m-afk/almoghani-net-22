// ============= Full file contents =============

import { useState } from "react";
import {
  Clapperboard, Film, Globe, MessageCircle, MoonStar, Newspaper, Phone, Search,
  ShieldCheck, Settings, Trophy, Tv, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BroadcastWordmark } from "@/components/broadcast-shell";
import { applyMovieConfig, useCatalog, useSiteConfig } from "@/lib/site-config";
import { movies } from "@/lib/movies";
import { bedouinSeries } from "@/lib/bedouin-series";
import m0 from "@/assets/iptv-movies/gGaozLyl-y4.jpg.asset.json";
import m1 from "@/assets/iptv-movies/1obs9eMxNAI.jpg.asset.json";
import m2 from "@/assets/iptv-movies/omnLea1B3jc.jpg.asset.json";
import m3 from "@/assets/iptv-movies/gr8ExWtFglY.jpg.asset.json";
import m4 from "@/assets/iptv-movies/1LZvuOn9zEQ.jpg.asset.json";
import m5 from "@/assets/iptv-movies/CUFlewlkV54.jpg.asset.json";
import m6 from "@/assets/iptv-movies/ELOQ0O2kKGU.jpg.asset.json";
import m7 from "@/assets/iptv-movies/y_6zrQZRJr8.jpg.asset.json";

const art = [m0, m1, m2, m3, m4, m5, m6, m7];

const shortcuts = [
  { href: "/channels/sports", title: "الرياضة", Icon: Trophy },
  { href: "/channels/news", title: "الأخبار", Icon: Newspaper },
  { href: "/channels/islamic", title: "القنوات الإسلامية", Icon: MoonStar },
  { href: "/sections", title: "الأقسام", Icon: Newspaper },
  { href: "/chat", title: "الدردشة", Icon: MessageCircle },
];

export function GoldHome({ application = false, preview = false }: { application?: boolean; preview?: boolean }) {
  const [q, setQ] = useState("");
  const channels = useCatalog();
  const { data: config } = useSiteConfig();
  const featured = ["mbc-1", "sbc-tv", "saudi-tv", "aljazeera", "ar-rotana-cinema", "alarabiya"]
    .flatMap((id) => {
      const found = channels.find((channel) => channel.id === id);
      return found ? [found] : [];
    });
  const films = applyMovieConfig(movies, config)
    .filter((movie) => movies.slice(0, 8).some((original) => original.id === movie.id))
    .slice(0, 8);
  // No top menus on this screen: every site destination stays reachable from the bottom row.
  const access = [
    { href: "/auth", title: "دخول الأعضاء", Icon: User },
    { href: "/my-account", title: "الإعدادات", Icon: Settings },
    { href: application ? "/" : "/tv", title: application ? "الموقع" : "التطبيق", Icon: Globe },
    { href: "/contact", title: "التواصل", Icon: Phone },
    { href: "/admin", title: "لوحة التحكم", Icon: ShieldCheck },
  ];

  return (
    <div className="media-home" dir="rtl" onClickCapture={preview ? (event) => { event.preventDefault(); event.stopPropagation(); } : undefined}>
      <main className="media-home-rows">
        <section className="media-home-row" aria-label="البث المباشر">
          <Button asChild variant="secondary" className="media-category">
            <a href="/live"><Tv /><span>بث مباشر</span></a>
          </Button>
          <div className="media-shelf media-channel-shelf">
            {featured.map((channel) => (
              <Button asChild key={channel.id} variant="ghost" className="media-channel-tile">
                <a href={`/live?channel=${encodeURIComponent(channel.id)}`} aria-label={`شغّل ${channel.name}`}>
                  <img src={channel.thumbnail} alt={channel.name} width={200} height={200} />
                  <span>{channel.name}</span>
                </a>
              </Button>
            ))}
          </div>
        </section>
        <section className="media-home-row" aria-label="الأفلام">
          <Button asChild variant="secondary" className="media-category">
            <a href="/movies"><Film /><span>أفلام</span></a>
          </Button>
          <div className="media-shelf media-poster-shelf">
            {films.map((movie) => {
              const index = movies.findIndex((original) => original.id === movie.id);
              return (
                <Button asChild key={movie.id} variant="ghost" className="media-poster">
                  <a href="/movies" aria-label={movie.title}>
                    <img src={art[index]?.url ?? m0.url} alt="" width={480} height={360} loading="lazy" />
                    <span>{movie.title}</span>
                  </a>
                </Button>
              );
            })}
          </div>
        </section>
        <section className="media-home-row" aria-label="المسلسلات">
          <Button asChild variant="secondary" className="media-category">
            <a href="/bedouin-drama"><Clapperboard /><span>مسلسلات</span></a>
          </Button>
          <div className="media-shelf media-poster-shelf">
            {bedouinSeries.slice(0, 8).map((series) => (
              <Button asChild key={series.id} variant="ghost" className="media-poster media-series-poster">
                <a href="/bedouin-drama" aria-label={`عرض حلقات ${series.title}`}>
                  <img
                    src={series.episodes.find((episode) => episode.number === 1)?.image ?? series.episodes[0]?.image}
                    alt=""
                    width={480}
                    height={360}
                    loading="lazy"
                  />
                  <span>{series.title}</span>
                </a>
              </Button>
            ))}
          </div>
        </section>
      </main>
      {!preview && <form
        className="media-search"
        onSubmit={(event) => {
          event.preventDefault();
          window.location.href = `/live?q=${encodeURIComponent(q.trim())}`;
        }}
      >
        <Search />
        <input
          id="media-search"
          aria-label="ابحث عن قناة"
          placeholder="البحث في القنوات"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Button type="submit" variant="ghost" size="icon" aria-label="بحث"><Search /></Button>
      </form>}
      <nav className="media-shortcuts" aria-label="بقية الأقسام">
        {shortcuts.map(({ href, title, Icon }) => (
          <Button asChild key={href} variant="ghost"><a href={href}><Icon />{title}</a></Button>
        ))}
      </nav>
      <nav className="media-access" aria-label="أزرار الوصول">
        {access.map(({ href, title, Icon }) => (
          <Button asChild key={href} variant="ghost"><a href={href}><Icon />{title}</a></Button>
        ))}
      </nav>
      <div className="media-home-brand"><BroadcastWordmark /></div>
    </div>
  );
}
