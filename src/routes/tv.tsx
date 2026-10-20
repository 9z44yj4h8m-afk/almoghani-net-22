import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutCanvas, type CanvasItem } from "@/components/layout-canvas";
import { useEffect, useState } from "react";
import { Settings, Tv, Film, Clapperboard, ChevronRight, RefreshCw, User, LogOut, CalendarDays, MonitorPlay, Globe } from "lucide-react";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: "واجهة التطبيق — المغني لايف" },
      { name: "description", content: "واجهة IPTV: البث المباشر والأفلام والمسلسلات والإعدادات في شاشة واحدة." },
      { property: "og:title", content: "واجهة التطبيق — المغني لايف" },
      { property: "og:description", content: "البث المباشر والأفلام والمسلسلات بواجهة IPTV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TvHub,
});

const tvDefaults: CanvasItem[] = [
  { id: "live", type: "tile", x: 1, y: 2, w: 40, h: 96, label: "البث المباشر", sub: "LIVE TV", link: "/live", color: "#1d4ed8", radius: 18 },
  { id: "movies", type: "tile", x: 43, y: 2, w: 27, h: 96, label: "الأفلام", sub: "MOVIES", link: "/movies", color: "#7c3aed", radius: 18 },
  { id: "series", type: "tile", x: 72, y: 2, w: 27, h: 96, label: "المسلسلات", sub: "SERIES", link: "/bedouin-drama", color: "#0d9488", radius: 18 },
];

function TvHub() {
  const [now, setNow] = useState({ time: "", day: "", date: "" });
  useEffect(() => {
    const t = () => {
      const d = new Date();
      setNow({
        time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        day: d.toLocaleDateString("ar-SA", { weekday: "long" }),
        date: d.toISOString().slice(0, 10),
      });
    };
    t(); const i = setInterval(t, 15000); return () => clearInterval(i);
  }, []);
  /* tiles now editable via LayoutCanvas */
  const _tiles = [
    { to: "/live", ar: "البث المباشر", en: "LIVE TV", Icon: Tv, cls: "sp-live" },
    { to: "/movies", ar: "الأفلام", en: "MOVIES", Icon: Film, cls: "sp-movies" },
    { to: "/bedouin-drama", ar: "المسلسلات", en: "SERIES", Icon: Clapperboard, cls: "sp-series" },
  ] as const;
  return <div className="sp-hub" dir="ltr">
    <header className="sp-head">
      <div className="sp-brand"><MonitorPlay className="sp-logo" /><div><strong>ALMOGHANI <b>LIVE</b></strong><small>IPTV SOLUTIONS</small></div></div>
      <div className="sp-meta">
        <Link to="/" preload="intent" className="sp-site-btn"><Globe /><span>الموقع</span></Link>
        <span className="sp-sep" />
        <time className="sp-time">{now.time}</time>
        <span className="sp-sep" />
        <div className="sp-date"><span dir="rtl">{now.day}</span><span>{now.date}</span></div>
        <Link to="/my-account" aria-label="الإعدادات" className="sp-icon"><Settings /></Link>
        <Link to="/my-account" aria-label="الحساب" className="sp-icon"><User /></Link>
      </div>
    </header>
    <LayoutCanvas settingsKey="tv_layout" defaults={tvDefaults} />
    <div className="sp-actions" dir="rtl">
      <Link to="/auth" preload="intent" className="sp-btn"><span>تسجيل الخروج</span><LogOut /></Link>
      <Link to="/my-account" preload="intent" className="sp-btn"><span>الحساب</span><User /></Link>
      <button type="button" className="sp-btn" onClick={() => window.location.reload()}><span>إعادة تحميل</span><RefreshCw /></button>
    </div>
    <p className="sp-expiry" dir="rtl"><span>تنتهي الاشتراك في : من صفحة الحساب</span><CalendarDays /></p>
  </div>;
}
