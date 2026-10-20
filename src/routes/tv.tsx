import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Settings, Tv, Film, Clapperboard, ChevronLeft } from "lucide-react";
import live from "@/assets/section-live.jpg";
import movies from "@/assets/section-movies.jpg";
import series from "@/assets/section-series.jpg";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: "واجهة التطبيق — المغني لايف" },
      { name: "description", content: "واجهة IPTV: البث المباشر والأفلام والمسلسلات والإعدادات في شاشة واحدة." },
      { property: "og:title", content: "واجهة التطبيق — المغني لايف" },
      { property: "og:description", content: "البث المباشر والأفلام والمسلسلات بواجهة IPTV فضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TvHub,
});

function TvHub() {
  const [now, setNow] = useState("");
  useEffect(() => { const t = () => setNow(new Date().toLocaleTimeString("en-GB")); t(); const i = setInterval(t, 1000); return () => clearInterval(i); }, []);
  const tiles = [
    { to: "/bedouin-drama", ar: "المسلسلات", en: "SERIES", img: series, Icon: Clapperboard },
    { to: "/movies", ar: "الأفلام", en: "MOVIES", img: movies, Icon: Film },
    { to: "/live", ar: "البث المباشر", en: "LIVE TV", img: live, Icon: Tv },
  ] as const;
  return <main dir="rtl" className="tv-hub">
    <header className="iptv-ref-head"><h1 dir="ltr">ALMOGHANI <small>LIVE</small></h1><div className="iptv-ref-meta"><span><Crown className="inline h-4 w-4" /> VIP Premium</span><time>{now}</time></div></header>
    <div className="tv-hub-tiles">
      {[...tiles].reverse().map(({ to, ar, en, img, Icon }) => <Link key={to} to={to} className="tv-hub-tile">
        <div className="tv-hub-art"><img src={img} alt="" loading="lazy" /><span><Icon /></span></div>
        <div className="tv-hub-label"><strong>{ar}</strong><small dir="ltr">{en}</small></div>
      </Link>)}
    </div>
    <div className="tv-hub-row">
      <Link to="/live" className="tv-hub-bar"><Tv /> <span>متابعة المشاهدة — افتح البث المباشر</span><ChevronLeft /></Link>
      <Link to="/my-account" className="tv-hub-settings"><Settings /><strong>الإعدادات</strong><small dir="ltr">SETTINGS</small></Link>
    </div>
  </main>;
}
