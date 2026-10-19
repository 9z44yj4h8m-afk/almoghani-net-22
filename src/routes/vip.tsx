import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MemberLibraryGate } from "@/components/member-library-gate";
import { PortalPage } from "@/components/portal-page";
import { SmartersLibrary } from "@/components/smarters-library";

export const Route = createFileRoute("/vip")({
  validateSearch: (search: Record<string, unknown>): { kind?: string | undefined; group?: string | undefined; q?: string | undefined } => ({ kind: typeof search["kind"] === "string" ? search["kind"] : undefined, group: typeof search["group"] === "string" ? search["group"] : undefined, q: typeof search["q"] === "string" ? search["q"] : undefined }),
  head: () => ({
    meta: [
      { title: "البث في التطبيق — المغني لايف" },
      { name: "description", content: "المشغّل والقنوات والأقسام والبحث في تطبيق المغني لايف، بنفس شاشة الموقع." },
      { property: "og:title", content: "البث في التطبيق — المغني لايف" },
      { property: "og:description", content: "شاشة بث موحدة مع البحث والمفضلة ومكتبة خاصة للأعضاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SmartersPage,
});

function SmartersPage() {
  const { kind, group } = Route.useSearch();
  const [catalogOpen, setCatalogOpen] = useState(false);
  if (!catalogOpen && (group || kind === "movie" || kind === "series")) return <MemberLibraryGate><SmartersLibrary initialGroup={group} onCatalog={() => setCatalogOpen(true)} /></MemberLibraryGate>;
  return <PortalPage homepage />;
}
