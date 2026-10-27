import { createFileRoute } from "@tanstack/react-router";
import { GoldHome } from "@/components/gold-home";

export const Route = createFileRoute("/design-preview")({
  head: () => ({ meta: [
    { title: "معاينة التصميم — ALMOGHANI LIVE" },
    { name: "description", content: "معاينة تصميم المغني لايف قبل الحفظ." },
    { property: "og:title", content: "معاينة التصميم — ALMOGHANI LIVE" },
    { property: "og:description", content: "معاينة بطاقات وأقسام المغني لايف." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: GoldHome,
});