import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/unlock")({
  validateSearch: (s: Record<string, unknown>) => { const t = s["to"]; return { to: typeof t === "string" && t.startsWith("/") && !t.startsWith("//") ? t : "/" }; },
  head: () => ({
    meta: [
      { title: "الدخول إلى الموقع | المغني لايف" },
      { name: "description", content: "صفحات المغني لايف متاحة دون رقم سري." },
      { property: "og:title", content: "الدخول إلى الموقع | المغني لايف" },
      { property: "og:description", content: "صفحات المغني لايف متاحة دون رقم سري." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const { to } = Route.useSearch();
  useEffect(() => {
    const destination = new URL(to, window.location.origin);
    window.location.replace(destination.origin === window.location.origin && destination.pathname !== "/unlock" ? destination.href : "/");
  }, [to]);
  return <main className="flex min-h-dvh items-center justify-center bg-background text-foreground">جارٍ فتح الصفحة…</main>;
}
