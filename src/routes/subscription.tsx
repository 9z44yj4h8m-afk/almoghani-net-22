import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ExternalLink, MessageCircle } from "lucide-react";
import { CONTACT_NAME, PROVIDER_URL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/subscription";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title: "باقات الاشتراك — المغني لايف" },
      { name: "description", content: "باقات اشتراك شهرية وسنوية: قنوات رياضية، أفلام ومسلسلات. للاشتراك تواصل واتساب." },
      { property: "og:title", content: "باقات الاشتراك — المغني لايف" },
      { property: "og:description", content: "اشترك في الباقة الشهرية أو السنوية عبر واتساب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubscriptionPage,
});

const plans = [
  {
    name: "الباقة الشهرية",
    period: "شهر واحد",
    features: ["قنوات رياضية beIN SPORTS و SSC بجودة عالية", "أفلام ومسلسلات نتفليكس وشاهد", "آلاف القنوات العربية والعالمية", "يعمل على الجوال والتلفزيون والكمبيوتر"],
  },
  {
    name: "الباقة السنوية",
    period: "12 شهر",
    featured: true,
    features: ["كل محتويات الباقة الشهرية", "مكتبة أفلام ومسلسلات كاملة تتحدث باستمرار", "قنوات 4K و FHD", "دعم فني مباشر طوال السنة"],
  },
];

function SubscriptionPage() {
  const price = `للاشتراك تواصل whatsapp ${WHATSAPP_DISPLAY}`;
  return (
    <div dir="rtl" className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          <Link to="/" className="icon-button shrink-0" aria-label="رجوع"><ArrowRight className="h-5 w-5" /></Link>
          <h1 className="text-lg font-black text-primary sm:text-xl">باقات الاشتراك</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <article key={p.name} className={`rounded-2xl border bg-surface p-6 ${p.featured ? "border-primary" : "border-border"}`}>
              <p className="text-sm font-bold text-muted-foreground">{p.period}</p>
              <h2 className="mt-1 text-2xl font-black">{p.name}</h2>
              <p className="mt-3 font-black text-primary">( {price} )</p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-sky" />{f}</li>
                ))}
              </ul>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-black text-primary-foreground">
                <MessageCircle className="h-5 w-5" /> اشترك عبر واتساب
              </a>
            </article>
          ))}
        </div>
        <section className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="font-black">للاشتراك تواصل whatsapp {WHATSAPP_DISPLAY} — {CONTACT_NAME}</p>
          <a href={PROVIDER_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-sky underline">
            موقع المزوّد <ExternalLink className="h-4 w-4" />
          </a>
        </section>
      </main>
    </div>
  );
}
