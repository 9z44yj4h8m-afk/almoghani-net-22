import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, AtSign, Camera, Ghost, Home, ExternalLink, Radio } from "lucide-react";
import { useSiteConfig, defaultContacts } from "@/lib/site-config";

function buildContacts(c: typeof defaultContacts) {
  const digits = c.whatsapp.replace(/\D/g, "").replace(/^0/, "966");
  const handle = (v: string) => v.trim().replace(/^@/, "");
  return [
    { name: "واتساب", value: c.whatsapp, href: c.whatsapp ? `https://wa.me/${digits}` : "", icon: MessageCircle },
    { name: "البريد", value: c.email, href: c.email ? `mailto:${c.email}` : "", icon: Mail },
    { name: "سناب شات", value: c.snapchat, href: c.snapchat ? `https://www.snapchat.com/add/${handle(c.snapchat)}` : "", icon: Ghost },
    { name: "إكس (تويتر)", value: c.x, href: c.x ? `https://x.com/${handle(c.x)}` : "", icon: AtSign },
    { name: "انستقرام", value: c.instagram, href: c.instagram ? `https://instagram.com/${handle(c.instagram)}` : "", icon: Camera },
  ];
}

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "للتواصل — المغني لايف" },
    { name: "description", content: "تواصل مع المغني عبر واتساب والبريد وحسابات التواصل الاجتماعي." },
    { property: "og:title", content: "للتواصل — المغني لايف" },
    { property: "og:description", content: "واتساب والبريد وحسابات المغني الرسمية." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ContactPage,
});

const tiles: Record<string, string> = {
  "واتساب": "bg-whatsapp text-foreground",
  "البريد": "bg-mail text-foreground",
  "سناب شات": "bg-snap text-background",
  "إكس (تويتر)": "bg-xbrand text-foreground border border-sky/50",
  "انستقرام": "bg-primary text-primary-foreground",
};
const labels: Record<string, string> = { "واتساب": "الواتساب", "البريد": "البريد الإلكتروني", "سناب شات": "Snapchat", "إكس (تويتر)": "تويتر" };

function Logo({ small }: { small?: boolean }) {
  return (
    <span dir="ltr" className={`inline-flex items-center gap-1 font-black tracking-tight ${small ? "text-lg" : "text-2xl"}`}>
      ALMOGHANI<span className="text-primary">LIVE</span><Radio className="h-4 w-4 text-primary" />
    </span>
  );
}

function ContactPage() {
  const { data } = useSiteConfig();
  const list = buildContacts(data?.contacts ?? defaultContacts).filter((c) => c.href);
  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-sky/70 bg-background/80 p-5 shadow-[0_0_30px_-5px_var(--sky)]">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 rounded-xl border border-sky/60 px-3 py-1.5 text-sm font-bold"><Home className="h-4 w-4" />الرئيسية</Link>
          <Logo />
        </header>
        <h1 className="mt-8 text-center font-display text-5xl font-black text-primary [text-shadow:0_0_20px_var(--primary)]">تواصل معنا</h1>
        <div className="mt-3 flex items-center justify-center gap-3 text-lg font-bold">
          <span className="h-px w-12 bg-primary" />يسعدنا تواصلك<span className="h-px w-12 bg-primary" />
        </div>
        <div className="mt-8 grid gap-4">
          {list.map((c) => { const Icon = c.icon ?? MessageCircle; return (
            <a key={c.name} href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-3xl border-2 border-sky/70 bg-card/60 p-4 shadow-[0_0_18px_-6px_var(--sky)] transition hover:border-sky">
              <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${tiles[c.name] ?? "bg-primary"}`}><Icon className="h-9 w-9" /></span>
              <span className="min-w-0 flex-1 border-r border-sky/30 pr-4">
                <span className="block text-xl font-black">{labels[c.name] ?? c.name}</span>
                <span dir="ltr" className="block truncate text-lg font-black">{c.value}</span>
              </span>
              <ExternalLink className="h-6 w-6 shrink-0 text-sky" />
            </a>); })}
        </div>
        <Link to="/" className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-2xl border border-primary bg-primary px-8 py-3 font-black text-primary-foreground shadow-[0_0_20px_-4px_var(--primary)]"><Home className="h-5 w-5" />العودة إلى الرئيسية</Link>
        <div className="mt-6 text-center"><Logo small /></div>
      </div>
    </div>
  );
}
