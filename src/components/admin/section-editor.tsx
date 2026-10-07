import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteConfig, siteConfigKey } from "@/lib/site-config";
import { defaultSectionContent, editableCards, getSectionCard, sectionDestinations, type SectionContent, type SectionCard } from "@/lib/section-content";
import { liveSections } from "@/components/portal-page";

const input = "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-foreground";
export function SectionEditor() {
  const { data, isPending } = useSiteConfig();
  const qc = useQueryClient();
  const [content, setContent] = useState<SectionContent>(defaultSectionContent);
  const [selected, setSelected] = useState(editableCards[0].id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (data) setContent(data.sectionContent); }, [data]);
  const card = getSectionCard(selected, content);
  const update = (patch: Partial<SectionCard>) => setContent((old) => ({ ...old, cards: { ...old.cards, [selected]: { ...old.cards[selected], ...patch } } }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      for (const c of Object.values(content.cards)) {
        if (c.image && !/^(https:\/\/|\/__l5e\/assets-v1\/)/.test(c.image)) throw new Error("رابط الصورة يجب أن يبدأ بـ https.");
      }
      const { error } = await supabase.from("site_settings").upsert({ key: "section-content", value: JSON.parse(JSON.stringify(content)), updated_at: new Date().toISOString() });
      if (error) throw new Error("تعذّر الحفظ؛ حاول مجددًا.");
      await qc.invalidateQueries({ queryKey: siteConfigKey }); setMessage("تم حفظ الصور والعناوين والروابط ✓");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذّر الحفظ."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">الصور والأقسام</h2><Button disabled={busy || isPending} type="submit"><Save />{busy ? "جارٍ الحفظ…" : "حفظ التغييرات"}</Button></div>
    <fieldset disabled={busy || isPending} className="space-y-6">
      <label className="block space-y-2">اختر البطاقة<select className={input} value={selected} onChange={(e) => { setSelected(e.target.value); setMessage(""); }}>{editableCards.map((c) => <option key={c.id} value={c.id}>{c.location}</option>)}</select></label>
      <img src={card.image} alt="معاينة صورة القسم" className="aspect-video w-full max-w-lg rounded-lg object-cover" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">عنوان البطاقة<input className={input} required maxLength={80} value={card.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label className="block space-y-1">كلام زر الدخول<input className={input} required maxLength={50} value={card.button} onChange={(e) => update({ button: e.target.value })} /></label>
        <label className="block space-y-1 sm:col-span-2">الكلام تحت العنوان<textarea className={input} maxLength={200} rows={2} value={card.description} onChange={(e) => update({ description: e.target.value })} /></label>
        <label className="block space-y-1">رابط الصورة<input className={input} type="url" dir="ltr" value={content.cards[selected]?.image ?? ""} placeholder="https://…" onChange={(e) => update({ image: e.target.value || editableCards.find((c) => c.id === selected)?.defaults.image })} /></label>
        <label className="block space-y-1">الصفحة عند الضغط<select className={input} value={card.link} onChange={(e) => update({ link: e.target.value })}>{sectionDestinations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
      </div>
      <Button type="button" variant="outline" onClick={() => setContent((old) => { const cards = { ...old.cards }; delete cards[selected]; return { ...old, cards }; })}><RotateCcw />إرجاع البطاقة الأصلية</Button>
      <div className="space-y-4 border-t border-border pt-6"><h3 className="font-bold">عنوان صفحة الأقسام</h3>
        <label className="block space-y-1">عنوان الصفحة<input className={input} required maxLength={80} value={content.pageTitle} onChange={(e) => setContent({ ...content, pageTitle: e.target.value })} /></label>
        <label className="block space-y-1">وصف الصفحة<input className={input} maxLength={200} value={content.pageDescription} onChange={(e) => setContent({ ...content, pageDescription: e.target.value })} /></label>
      </div>
      <div className="space-y-4 border-t border-border pt-6"><h3 className="font-bold">عناوين أقسام القنوات</h3><div className="grid gap-4 sm:grid-cols-2">{liveSections.map((s) => <label key={s.slug} className="block space-y-1">{s.title}<input className={input} required maxLength={80} value={content.titles[s.slug] ?? s.title} onChange={(e) => setContent({ ...content, titles: { ...content.titles, [s.slug]: e.target.value } })} /></label>)}</div></div>
    </fieldset>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>;
}