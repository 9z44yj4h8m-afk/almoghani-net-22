import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Tv, Film, Clapperboard, LayoutGrid, MessageCircle, UserRound, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoNeon from "@/assets/logo-neon.png.asset.json";

const destinations = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/live", label: "البث المباشر", Icon: Tv },
  { to: "/movies", label: "الأفلام", Icon: Film },
  { to: "/bedouin-drama", label: "البدوية دراما", Icon: Clapperboard },
  { to: "/sections", label: "الأقسام", Icon: LayoutGrid },
  { to: "/chat", label: "الدردشة", Icon: MessageCircle },
  { to: "/auth", label: "دخول الأعضاء", Icon: UserRound },
  { to: "/contact", label: "التواصل", Icon: Phone },
] as const;

export function IptvNavigation() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return <aside className="iptv-navigation" dir="rtl">
    <Link to="/" className="iptv-rail-brand" aria-label="ALMOGHANI LIVE"><Radio /><span dir="ltr">ALMOGHANI<small>LIVE</small></span></Link>
    <nav aria-label="قائمة الموقع">{destinations.map(({ to, label, Icon }) => {
      const active = to === "/" ? path === "/" : path.startsWith(to) || (to === "/live" && path.startsWith("/channels/"));
      return <Button key={to} asChild variant="ghost" className={`iptv-navigation-item ${active ? "iptv-navigation-active" : ""}`}><Link to={to} aria-current={active ? "page" : undefined}><Icon /><span>{label}</span></Link></Button>;
    })}</nav>
  </aside>;
}

export function IptvHomeModes() {
  return <nav className="iptv-home-modes" aria-label="أقسام المشاهدة الرئيسية">
    <Button asChild className="iptv-mode iptv-mode-live"><Link to="/live"><Tv /><span>بث مباشر<small dir="ltr">LIVE TV</small></span></Link></Button>
    <Button asChild variant="secondary" className="iptv-mode iptv-mode-movies"><Link to="/movies"><Film /><span>الأفلام<small dir="ltr">MOVIES</small></span></Link></Button>
    <Button asChild variant="secondary" className="iptv-mode iptv-mode-series"><Link to="/bedouin-drama"><Clapperboard /><span>المسلسلات<small dir="ltr">SERIES</small></span></Link></Button>
  </nav>;
}