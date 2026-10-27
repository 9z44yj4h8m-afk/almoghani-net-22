import { createFileRoute, redirect } from "@tanstack/react-router";
import { GoldHome } from "@/components/gold-home";

export const Route = createFileRoute("/")({
  beforeLoad: ({ url }) => {
    // Channel deep links now play in the live workspace; the new homepage is display-only.
    const channel = url ? new URLSearchParams(url.search).get("channel") : null;
    if (channel) throw redirect({ href: `/live?channel=${encodeURIComponent(channel)}` });
  },
  head: () => ({
    meta: [
      { title: "المغني لايف — بث مباشر" },
      {
        name: "description",
        content: "شاهد القنوات المباشرة داخل المغني لايف بواجهة عربية سريعة وواضحة.",
      },
      { property: "og:title", content: "المغني لايف — بث مباشر" },
      {
        property: "og:description",
        content: "مشاهدة القنوات المباشرة من مشغّل واحد داخل الموقع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <GoldHome />,
});

