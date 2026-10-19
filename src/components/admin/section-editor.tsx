import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw, ArrowUp, ArrowDown, Plus, Copy, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteConfig, siteConfigKey, siteFonts } from "@/lib/site-config";
import { SectionCardStyle } from "@/components/section-card-style";
import { defaultSectionContent, editableCards, getSectionCard, orderedSectionIds, sectionDestinations, sectionGroups, sectionCardId, sectionEditorCards, addSection, deleteSection, restoreSection, type SectionGroup, type SectionContent, type SectionCard } from "@/lib/section-content";
import { liveSections } from "@/components/portal-page";

const input = "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-foreground";
export function SectionEditor() {
  const { data, isPending } = useSiteConfig();
  const qc = useQueryClient();
  const [content, setContent] = useState<SectionContent>(defaultSectionContent);
  const [selected, setSelected] = useState("home-live");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [newGroup, setNewGroup] = useState<SectionGroup>("sections");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  useEffect(() => { if (data) setContent(data.sectionContent); }, [data]);
  const availableCards = sectionEditorCards(content);
  function create(source?: SectionCard) {
    const id = `custom-${crypto.randomUUID()}`;
    setContent((old) => addSection(old, newGroup, id, source));
    setSelected(sectionCardId(newGroup, id));
    setMessage("");
  }
  const card = getSectionCard(selected, content);
  const update = (patch: Partial<SectionCard>) => setContent((old) => ({ ...old, cards: { ...old.cards, [selected]: { ...old.cards[selected], ...patch } } }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      for (const c of [...Object.values(content.cards), ...(content.customSections ?? []).map((s) => s.defaults)]) {
        if (c.image && !/^(https:\/\/|\/__l5e\/assets-v1\/|\/assets\/|\/src\/assets\/)/.test(c.image) && !editableCards.some((item) => item.defaults.image === c.image)) throw new Error("رابط الصورة يجب أن يبدأ بـ https.");
      }
      const { error } = await supabase.from("site_settings").upsert({ key: "section-content", value: JSON.parse(JSON.stringify(content)), updated_at: new Date().toISOString() });
      if (error) throw new Error("تعذّر الحفظ؛ حاول مجددًا.");
      await qc.invalidateQueries({ queryKey: siteConfigKey }); setMessage("تم حفظ الأقسام والصور والترتيب ✓");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذّر الحفظ."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">الصور والأقسام</h2><Button disabled={busy || isPending} type="submit"><Save />{busy ? "جارٍ الحفظ…" : "حفظ التغييرات"}</Button></div>
    <fieldset disabled={busy || isPending} className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 space-y-2">مكان القسم الجديد<select aria-label="مكان القسم الجديد" className={input} value={newGroup} onChange={(e) => setNewGroup(e.target.value as SectionGroup)}>{sectionGroups.map((g) => <option key={g.group} value={g.group}>{g.title}</option>)}</select></label>
        <Button type="button" onClick={() => create()}><Plus />إضافة قسم</Button>
        <Button type="button" variant="outline" onClick={() => create(card)}><Copy />نسخ القسم المحدد</Button>
      </div>
      <label className="block space-y-2">اختر البطاقة<select aria-label="اختر البطاقة" className={input} value={selected} onChange={(e) => { setSelected(e.target.value); setMessage(""); }}>{availableCards.map((c) => <option key={c.id} value={c.id}>{c.location}</option>)}</select></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={!card.hidden} onChange={(e) => update({ hidden: !e.target.checked })} />إظهار البطاقة</label>
      <SectionCardStyle id="editor-preview" card={card} />
      <div data-section-card="editor-preview" className="section-page-card grid grid-cols-[minmax(0,1fr)_40%] items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-3">
        <div className="min-w-0 space-y-2"><h3 data-card-text="title" className="text-xl font-bold">{card.title}</h3><p data-card-text="description" className="text-sm text-muted-foreground">{card.description}</p><span data-card-text="button" className="block text-sm font-bold text-primary">{card.button}</span></div>
        <img src={card.image} alt="معاينة صورة القسم" className="h-36 w-full rounded-lg object-cover" />
      </div>
      <div className="flex flex-wrap gap-2">{editableCards.slice(3).map((item) => <Button key={item.id} type="button" variant={card.image === item.defaults.image ? "secondary" : "outline"} className="h-16 w-24 p-1" aria-label={`اختيار صورة ${item.defaults.title}`} title={item.defaults.title} onClick={() => update({ image: item.defaults.image })}><img src={item.defaults.image} alt="" className="h-full w-full rounded object-cover" /></Button>)}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">عنوان البطاقة<input className={input} required maxLength={80} value={card.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label className="block space-y-1">كلام زر الدخول<input className={input} required maxLength={50} value={card.button} onChange={(e) => update({ button: e.target.value })} /></label>
        <label className="block space-y-1 sm:col-span-2">الكلام تحت العنوان<textarea className={input} maxLength={200} rows={2} value={card.description} onChange={(e) => update({ description: e.target.value })} /></label>
        <label className="block space-y-1">رابط صورة جديدة<input className={input} type="url" dir="ltr" value={content.cards[selected]?.image?.startsWith("https://") ? content.cards[selected]?.image : ""} placeholder="https://…" onChange={(e) => update({ image: e.target.value })} /></label>
        <label className="block space-y-1">الصفحة عند الضغط<select className={input} value={card.link} onChange={(e) => update({ link: e.target.value })}>{sectionDestinations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
      </div>
      <Button type="button" variant="outline" onClick={() => setContent((old) => { const cards = { ...old.cards }; delete cards[selected]; return { ...old, cards }; })}><RotateCcw />إرجاع البطاقة الأصلية</Button>
      <div className="space-y-4 border-t border-border pt-6"><h3 className="font-bold">الخط ومقاسات البطاقة</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">خط البطاقة<select className={input} value={card.font ?? ""} onChange={(e) => update({ font: e.target.value })}><option value="">الخط الأصلي</option>{siteFonts.map((font) => <option key={font}>{font}</option>)}</select></label>
          <label className="block space-y-2">سماكة الخط<select className={input} value={card.fontWeight ?? ""} onChange={(e) => { if (e.target.value) update({ fontWeight: Number(e.target.value) }); }}><option value="">السماكة الأصلية</option><option value="400">عادي</option><option value="600">متوسط</option><option value="700">عريض</option><option value="900">عريض جدًا</option></select></label>
          {([{ key: "titleSize", label: "مقاس العنوان", min: 12, max: 40, fallback: 23, unit: "px" }, { key: "descriptionSize", label: "مقاس الوصف", min: 10, max: 24, fallback: 13, unit: "px" }, { key: "buttonSize", label: "مقاس كلام الزر", min: 10, max: 24, fallback: 14, unit: "px" }, { key: "imageWidth", label: "عرض الصورة", min: 25, max: 55, fallback: 44, unit: "%" }, { key: "imageHeight", label: "ارتفاع الصورة", min: 100, max: 320, fallback: 174, unit: "px" }] as const).map(({ key, label, min, max, fallback, unit }) => <label key={key} className="block space-y-2">{label} <span className="text-sm text-muted-foreground">{card[key] ?? fallback} {unit}</span><input aria-label={label} type="range" min={min} max={max} value={card[key] ?? fallback} onChange={(e) => update({ [key]: Number(e.target.value) })} className="block w-full accent-primary" /></label>)}
          <label className="block space-y-2">طريقة عرض الصورة<select className={input} value={card.imageFit ?? "cover"} onChange={(e) => update({ imageFit: e.target.value === "contain" ? "contain" : "cover" })}><option value="cover">ملء المساحة</option><option value="contain">الصورة كاملة</option></select></label>
        </div>
      </div>
      <div className="space-y-4 border-t border-border pt-6"><h3 className="font-bold">عنوان صفحة الأقسام</h3>
        <label className="block space-y-1">عنوان الصفحة<input className={input} required maxLength={80} value={content.pageTitle} onChange={(e) => setContent({ ...content, pageTitle: e.target.value })} /></label>
        <label className="block space-y-1">وصف الصفحة<input className={input} maxLength={200} value={content.pageDescription} onChange={(e) => setContent({ ...content, pageDescription: e.target.value })} /></label>
      </div>
      <div className="space-y-4 border-t border-border pt-6"><h3 className="font-bold">عناوين أقسام القنوات</h3><div className="grid gap-4 sm:grid-cols-2">{liveSections.map((s) => <label key={s.slug} className="block space-y-1">{s.title}<input className={input} required maxLength={80} value={content.titles[s.slug] ?? s.title} onChange={(e) => setContent({ ...content, titles: { ...content.titles, [s.slug]: e.target.value } })} /></label>)}</div></div>
      {sectionGroups.map(({ group, title, ids }) => {
        const order = orderedSectionIds(group, [...ids], content);
        return <div key={group} className="space-y-3 border-t border-border pt-6"><h3 className="font-bold">{title}</h3><ul className="divide-y divide-border">{order.map((id, i) => {
          const key = sectionCardId(group, id);
          const label = getSectionCard(key, content).title;
          const move = (direction: number) => {
            const next = [...order]; const target = i + direction;
            if (target < 0 || target >= next.length) return;
            const current = next[i]; const other = next[target];
            if (current === undefined || other === undefined) return;
            next[i] = other; next[target] = current;
            setContent((old) => ({ ...old, orders: { ...old.orders, [group]: next } }));
          };
          return <li key={id} className="flex flex-wrap items-center gap-2 py-3"><span className="min-w-0 basis-full font-bold sm:basis-auto sm:flex-1">{i + 1}. {label}</span><label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!getSectionCard(key, content).hidden} onChange={(e) => setContent((old) => ({ ...old, cards: { ...old.cards, [key]: { ...old.cards[key], hidden: !e.target.checked } } }))} />ظاهر</label><Button type="button" variant="outline" size="icon" title={`تعديل ${label}`} aria-label={`تعديل ${label}`} onClick={() => { setSelected(key); }}><Pencil /></Button><Button type="button" variant="outline" size="icon" disabled={i === 0} title={`تقديم ${label}`} aria-label={`تقديم ${label}`} onClick={() => move(-1)}><ArrowUp /></Button><Button type="button" variant="outline" size="icon" disabled={i === order.length - 1} title={`تأخير ${label}`} aria-label={`تأخير ${label}`} onClick={() => move(1)}><ArrowDown /></Button><Button type="button" variant="outline" size="icon" title={`حذف ${label}`} aria-label={`حذف ${label}`} onClick={() => setConfirmDelete(key)}><Trash2 /></Button></li>;
        })}</ul></div>;
      })}
      {confirmDelete && <div role="alert" className="space-y-3 border-t border-border pt-4"><p>حذف قسم «{getSectionCard(confirmDelete, content).title}» من العرض؟ القنوات والمحتوى داخله لن تُحذف.</p><div className="flex gap-2"><Button type="button" variant="destructive" onClick={() => { const next = deleteSection(content, confirmDelete); setContent(next); if (selected === confirmDelete) setSelected(sectionEditorCards(next)[0]?.id ?? "home-live"); setConfirmDelete(null); }}>تأكيد الحذف</Button><Button type="button" variant="outline" onClick={() => setConfirmDelete(null)}>إلغاء</Button></div></div>}
      {!!content.deletedIds?.length && <div className="space-y-3 border-t border-border pt-6"><h3 className="font-bold">الأقسام المحذوفة</h3>{content.deletedIds.map((id) => <div key={id} className="flex items-center justify-between gap-3"><span>{getSectionCard(id, content).title}</span><Button type="button" variant="outline" onClick={() => setContent((old) => restoreSection(old, id))}><RotateCcw />استعادة</Button></div>)}</div>}
    </fieldset>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>;
}