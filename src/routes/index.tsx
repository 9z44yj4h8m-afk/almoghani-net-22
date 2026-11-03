import { createFileRoute, redirect } from "@tanstack/react-router";

// Open the owner's approved standalone design; older pages remain available.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/atlas.html", statusCode: 302 });
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
