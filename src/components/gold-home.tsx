import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Search, User } from "lucide-react";
import hero from "@/assets/home/hero.jpg.asset.json";
import logo from "@/assets/home/logo.jpg.asset.json";
import live from "@/assets/home/live.jpg.asset.json";
import movies from "@/assets/home/movies.jpg.asset.json";
import series from "@/assets/home/series.jpg.asset.json";
import sports from "@/assets/home/sports.jpg.asset.json";
import news from "@/assets/home/news.jpg.asset.json";
import islamic from "@/assets/home/islamic.jpg.asset.json";
import ksa from "@/assets/home/ksa.jpg.asset.json";
import mbc from "@/assets/home/mbc.jpg.asset.json";
import sbc from "@/assets/home/sbc.jpg.asset.json";

const sections = [
  { img: live.url, label: "البث المباشر", href: "/live" },
  { img: movies.url, label: "الأفلام", href: "/movies" },
  { img: series.url, label: "المسلسلات", href: "/bedouin-drama" },
  { img: sports.url, label: "الرياضة", href: "/channels/sports" },
  { img: news.url, label: "الأخبار", href: "/channels/news" },
  { img: islamic.url, label: "القنوات الإسلامية", href: "/channels/islamic" },
];
const favs = [
  { img: ksa.url, label: "KSA", href: "/live?channel=saudi-tv" },
  { img: mbc.url, label: "MBC", href: "/live?channel=mbc-1" },
  { img: sbc.url, label: "SBC", href: "/live?channel=sbc-tv" },
];

const frame =
  "block overflow-hidden rounded-2xl border border-primary/60 shadow-[0_0_18px_-6px_var(--primary)] transition active:scale-[0.98]";

export function GoldHome() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const go = (href: string) => {
    window.location.href = href;
  };
  return (
    <div dir="rtl" className="mx-auto w-full max-w-xl space-y-5 px-3 py-4">
      <header className="flex items-center justify-between">
        <button aria-label="حسابي" onClick={() => navigate({ to: "/auth" })} className="grid h-11 w-11 place-items-center rounded-full border border-primary/60 text-foreground">
          <User className="h-5 w-5" />
        </button>
        <img src={logo.url} alt="ALMOGHANI LIVE PLAY" className="h-14 w-auto" />
        <span className="grid h-11 w-11 place-items-center rounded-full border border-primary/60 text-foreground">
          <Bell className="h-5 w-5" />
        </span>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(`/live${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
        }}
        className="flex items-center gap-2 rounded-full border border-primary/50 bg-card/70 px-4 py-3"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن قناة" className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
        <button type="submit" aria-label="بحث"><Search className="h-5 w-5 text-foreground" /></button>
      </form>

      <a href="/live" className={frame} aria-label="البث المباشر — شاهد الآن">
        <img src={hero.url} alt="البث المباشر" className="w-full" />
      </a>

      <h2 className="border-r-4 border-primary pr-2 text-lg font-bold text-foreground">اكتشف الأقسام</h2>
      <div className="grid grid-cols-2 gap-3">
        {sections.map((s) => (
          <a key={s.label} href={s.href} className={frame} aria-label={s.label}>
            <img src={s.img} alt={s.label} className="w-full" />
          </a>
        ))}
      </div>

      <h2 className="border-r-4 border-primary pr-2 text-lg font-bold text-foreground">قنواتك المفضلة</h2>
      <div className="grid grid-cols-3 gap-2">
        {favs.map((f) => (
          <a key={f.label} href={f.href} className={frame} aria-label={f.label}>
            <img src={f.img} alt={f.label} className="w-full" />
          </a>
        ))}
      </div>
    </div>
  );
}
