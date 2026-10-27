import { GoldHome } from "@/components/gold-home";
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
  return <div className="media-app"><GoldHome application /><details className="media-custom-layout"><summary>تصميمي المخصص وأدوات التعديل</summary><LayoutCanvas settingsKey="tv_layout" defaults={tvDefaults} /></details></div>;
}
