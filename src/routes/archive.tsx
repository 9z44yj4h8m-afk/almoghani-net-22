import { createFileRoute } from "@tanstack/react-router";
import { BroadcastAtlas } from "@/components/broadcast-atlas";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "أرشيف ALMOGHANI LIVE — أطلس البث" },
      {
        name: "description",
        content: "شاهد القنوات المباشرة داخل المغني لايف بواجهة عربية سريعة وواضحة.",
      },
      { property: "og:title", content: "أرشيف ALMOGHANI LIVE — أطلس البث" },
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

