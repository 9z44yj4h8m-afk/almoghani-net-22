import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, MessageCircle, AtSign, Camera, Ghost } from "lucide-react";
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
    { title: "للتواصل — ALMOGHANI LIVE" },
    { name: "description", content: "تواصل مع ALMOGHANI عبر واتساب والبريد وحسابات التواصل الاجتماعي." },
    { property: "og:title", content: "للتواصل — ALMOGHANI LIVE" },
    { property: "og:description", content: "واتساب والبريد وحسابات ALMOGHANI الرسمية." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSiteConfig();
  const list = buildContacts(data?.contacts ?? defaultContacts).filter((c) => c.href);
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4"><Link to="/" className="flex items-center gap-2 font-bold"><ArrowRight className="h-5 w-5" />ALMOGHANI LIVE</Link></header>
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="font-display text-4xl font-black">للتواصل</h1>
        <p className="mt-3 text-muted-foreground">almoghani smarter — نسعد بتواصلك في أي وقت.</p>
        <div className="mt-8 grid gap-3">
          {list.map((c) => { const Icon = c.icon ?? MessageCircle; return (
            <a key={c.name} href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary"><Icon className="h-6 w-6" /></span>
              <span><span className="block font-black">{c.name}</span><span dir="ltr" className="text-sm text-muted-foreground">{c.value}</span></span>
            </a>); })}
        </div>
        <Link to="/featured" className="mt-8 block rounded-2xl border border-sky/40 bg-sky/10 p-5 text-center font-black text-sky">almoghani smarter — جميع القنوات</Link>
      </main>
    </div>
  );
}
