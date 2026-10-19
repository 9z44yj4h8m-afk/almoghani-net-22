import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MemberLibraryGate } from "@/components/member-library-gate";
import { SmartersCatalog } from "@/components/smarters-catalog";
import { SmartersLibrary } from "@/components/smarters-library";

export const Route = createFileRoute("/vip")({
  validateSearch: (search: Record<string, unknown>): { kind?: string | undefined; group?: string | undefined; q?: string | undefined } => ({ kind: typeof search["kind"] === "string" ? search["kind"] : undefined, group: typeof search["group"] === "string" ? search["group"] : undefined, q: typeof search["q"] === "string" ? search["q"] : undefined }),
  head: () => ({
    meta: [
      { title: "قنوات سمارتر — المغني لايف" },
      { name: "description", content: "تصفّح قنوات Almoghani Smarter pro وسجّل الدخول للمشاهدة." },
      { property: "og:title", content: "قنوات سمارتر — المغني لايف" },
      { property: "og:description", content: "قنوات سمارتر مرتبة حسب التصنيف؛ المشاهدة للأعضاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SmartersPage,
});

function SmartersPage() {
  const { kind } = Route.useSearch();
  const [watchGroup, setWatchGroup] = useState<string | null>(null);
  if (watchGroup !== null || kind === "movie" || kind === "series") return <MemberLibraryGate><SmartersLibrary initialGroup={watchGroup ?? undefined} onCatalog={() => setWatchGroup(null)} /></MemberLibraryGate>;
  return <SmartersCatalog onMemberWatch={setWatchGroup} />;
}

