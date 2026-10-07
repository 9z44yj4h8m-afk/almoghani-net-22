import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, MoreHorizontal, Heart } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/sections", label: "الأقسام", icon: LayoutGrid },
  { to: "/featured", label: "المفضلة", icon: Heart },
  { to: "/contact", label: "المزيد", icon: MoreHorizontal },
] as const;

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <nav className="broadcast-bottom-nav" aria-label="التنقل السريع">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link key={to} to={to} className={`broadcast-nav-item ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function BreakingTicker() {
  return (
    <div className="reference-ticker flex items-stretch overflow-hidden border-y border-border bg-surface-deep">
      <span className="z-10 flex shrink-0 items-center bg-primary px-5 py-2 font-display text-lg font-black text-primary-foreground [clip-path:polygon(0_0,100%_0,100%_100%,12%_100%)]">
        العاجل
      </span>
      <div className="relative flex-1 overflow-hidden">
        <span className="ticker-wordmark" dir="ltr">ALMOGHANI <span>LIVE</span></span>
        <p className="news-ticker flex min-h-14 w-max items-center gap-2 whitespace-nowrap text-sm text-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          شاهد القنوات المباشرة والأفلام والقنوات المميزة على ALMOGHANI — للاشتراك تواصل واتساب 0557073007
        </p>
      </div>
    </div>
  );
}
