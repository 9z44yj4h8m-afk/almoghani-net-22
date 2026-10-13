import { createFileRoute, Link } from "@tanstack/react-router";
import homeArt from "@/assets/almoghani-home.png.asset.json";
import { WHATSAPP_URL } from "@/lib/subscription";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المغني لايف — ALMOGHANI LIVE" },
      { name: "description", content: "ادخل برنامج ALMOGHANI VOICE واشترك وتواصل معنا عبر واتساب أو البريد." },
      { property: "og:title", content: "المغني لايف — ALMOGHANI LIVE" },
      { property: "og:description", content: "برنامج ALMOGHANI VOICE: الدخول والاشتراك والتواصل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const hot = "absolute block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

function Home() {
  return (
    <main className="flex min-h-[100dvh] justify-center bg-background">
      <div className="relative w-full max-w-[480px]">
        <img src={homeArt.url} alt="ALMOGHANI LIVE" className="block h-auto w-full" />
        <Link to="/admin-voices" aria-label="للدخول للبرنامج" className={hot}
          style={{ left: "46.9%", top: "48.9%", width: "46.3%", height: "6%" }} />
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="اشترك الآن" className={hot}
          style={{ left: "47.8%", top: "67.9%", width: "46.1%", height: "5.8%" }} />
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="واتساب" className={hot}
          style={{ left: "65.7%", top: "84.4%", width: "28.7%", height: "6.3%" }} />
        <a href="mailto:ahmed@almoghani.net" aria-label="البريد الإلكتروني" className={hot}
          style={{ left: "32.1%", top: "84.4%", width: "31.5%", height: "6.3%" }} />
      </div>
    </main>
  );
}
