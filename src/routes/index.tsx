import { createFileRoute, Link } from "@tanstack/react-router";
import homeArt from "@/assets/almoghani-home.png.asset.json";
import { WHATSAPP_URL } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المغني لايف — ALMOGHANI LIVE" },
      { name: "description", content: "ادخل برنامج ALMOGHANI VOICE واشترك وتواصل معنا عبر واتساب أو البريد." },
      { property: "og:title", content: "المغني لايف — ALMOGHANI LIVE" },
      { property: "og:description", content: "برنامج ALMOGHANI VOICE: الدخول والاشتراك والتواصل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: homeArt.url },
      { name: "twitter:image", content: homeArt.url },
    ],
  }),
  component: Home,
});

const hotspotClass = "absolute block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

function Home() {
  return (
    <main className="flex min-h-[100dvh] justify-center bg-background">
      <div className="w-full max-w-[480px]">
        <nav dir="rtl" aria-label="دخول صفحة الأصوات" className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-3">
          <Button asChild variant="ghost" className="px-2 font-bold text-primary">
            <Link to="/admin-voices"><LogIn />صفحة الأصوات · دخول</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/unlock" search={{ to: "/admin-voices" }}><KeyRound />كتابة الرقم السري</Link>
          </Button>
        </nav>
        <div className="relative">
        <img src={homeArt.url} alt="ALMOGHANI LIVE" className="block h-auto w-full" />
        <Link to="/admin-voices" aria-label="للدخول للبرنامج" className={hotspotClass}
          style={{ left: "46.9%", top: "48.9%", width: "46.3%", height: "6%" }} />
        <Link to="/subscription" aria-label="اشترك الآن" className={hotspotClass}
          style={{ left: "47.8%", top: "67.9%", width: "46.1%", height: "5.8%" }} />
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="واتساب" className={hotspotClass}
          style={{ left: "65.7%", top: "84.4%", width: "28.7%", height: "6.3%" }} />
        <a href="mailto:ahmed@almoghani.net" aria-label="البريد الإلكتروني" className={hotspotClass}
          style={{ left: "32.1%", top: "84.4%", width: "31.5%", height: "6.3%" }} />
        </div>
      </div>
    </main>
  );
}
