import { createFileRoute } from "@tanstack/react-router";
import { BroadcastAtlas } from "@/components/broadcast-atlas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALMOGHANI LIVE — أطلس البث المباشر" },
      {
        name: "description",
        content: "شاهد القنوات المباشرة داخل المغني لايف بواجهة عربية سريعة وواضحة.",
      },
      { property: "og:title", content: "ALMOGHANI LIVE — أطلس البث المباشر" },
      {
        property: "og:description",
        content: "مشاهدة القنوات المباشرة من مشغّل واحد داخل الموقع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BroadcastAtlas,
});

