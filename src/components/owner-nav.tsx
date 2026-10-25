import { Link, useRouterState } from "@tanstack/react-router";

/** Rail linking the owner dashboards so the owner can move between them from any panel. */
const OWNER_LINKS = [
  { to: "/admin", label: "لوحة الموقع" },
  { to: "/admin-chat", label: "لوحة الشات" },
  { to: "/22", label: "لوحة الأصوات" },
  { to: "/100", label: "خصائص الأصوات" },
  { to: "/voice-store", label: "متجر الأصوات" },
  { to: "/schedule-admin", label: "مواعيد البث" },
] as const;

export function OwnerNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="التنقل بين لوحات المالك"
      className="flex flex-wrap items-center gap-2 border-b border-border bg-card/40 px-4 py-2 sm:px-6"
    >
      <span className="text-xs font-bold text-muted-foreground">لوحات المالك:</span>
      {OWNER_LINKS.map((l) => {
        const active = path === l.to || path.startsWith(`${l.to}/`);
        return (
          <Link
            key={l.to}
            to={l.to}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm no-underline ${
              active
                ? "border-primary bg-primary/15 font-bold text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
