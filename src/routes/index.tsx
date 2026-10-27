import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GoldHome } from "@/components/gold-home";

export const Route = createFileRoute("/")({
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
  component: () => {
    // Channel deep links now play in the live workspace; the new homepage is display-only.
    useEffect(() => {
      const channel = new URLSearchParams(window.location.search).get("channel");
      if (channel) window.location.replace(`/live?channel=${encodeURIComponent(channel)}`);
    }, []);
    return <GoldHome />;
  },
});

