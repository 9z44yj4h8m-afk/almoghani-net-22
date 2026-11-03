import { createFileRoute, redirect } from "@tanstack/react-router";

// The owner made the standalone IPTV page the homepage (3 Nov 2026); the previous homepage lives at /archive.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/iptv.html", statusCode: 302 });
  },
  head: () => ({
    meta: [
      { title: "ALMOGHANI LIVE — البث المباشر" },
      { name: "description", content: "صفحة القنوات والأفلام الرئيسية في المغني لايف." },
      { property: "og:title", content: "ALMOGHANI LIVE — البث المباشر" },
      { property: "og:description", content: "شاهد القنوات والأفلام من صفحة المغني لايف الرئيسية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
