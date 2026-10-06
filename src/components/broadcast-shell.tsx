import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Radio, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BroadcastWordmark({ compact = false }: { compact?: boolean }) {
  return <span className={`broadcast-brand ${compact ? "broadcast-brand-compact" : ""}`} dir="ltr"><span>ALMOGHANI<span className="text-primary"> LIVE<Radio className="brand-signal" aria-hidden="true" /></span></span><small dir="rtl">كل ما يهم البث</small></span>;
}

export function BroadcastHeader() {
  const path = useRouterState({ select: s => s.location.pathname });
  if (path === "/" || path === "/live" || path.startsWith("/channels/")) return null;
  return <header className="broadcast-site-header"><Link to="/" aria-label="ALMOGHANI LIVE"><BroadcastWordmark /></Link><Button asChild variant="outline" className="broadcast-search-link"><Link to="/live"><span>ابحث عن القنوات والبرامج…</span><Search /></Link></Button><Link to="/" className="broadcast-mini-brand"><BroadcastWordmark compact /></Link></header>;
}

export function BroadcastFooter() {
  return <footer className="broadcast-footer"><Link to="/" aria-label="ALMOGHANI LIVE"><BroadcastWordmark compact /></Link><Button asChild variant="broadcast" className="contact-cta"><Link to="/contact">للتواصل<ChevronLeft /></Link></Button></footer>;
}