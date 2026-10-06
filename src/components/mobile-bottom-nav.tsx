import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Mail, Star } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/live", label: "الأقسام", icon: LayoutGrid },
  { to: "/featured", label: "المميزة", icon: Star },
  { to: "/contact", label: "المزيد", icon: Mail },
] as const;

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <div className="h-16 lg:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface-deep/95 backdrop-blur lg:hidden">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-2.5 text-xs font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>
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
    <div className="flex items-stretch overflow-hidden border-y border-border bg-surface-deep">
      <span className="z-10 flex shrink-0 items-center bg-primary px-5 py-2 font-display text-lg font-black text-primary-foreground [clip-path:polygon(0_0,100%_0,100%_100%,12%_100%)]">
        العاجل
      </span>
      <div className="relative flex-1 overflow-hidden">
        <p className="news-ticker absolute inset-y-0 flex items-center gap-2 whitespace-nowrap text-sm text-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          شاهد القنوات المباشرة والأفلام والقنوات المميزة على ALMOGHANI — للاشتراك تواصل واتساب 0557073007
        </p>
      </div>
    </div>
  );
}
