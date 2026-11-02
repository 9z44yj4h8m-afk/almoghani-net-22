import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteConfig, siteConfigKey } from "@/lib/site-config";
import { liveSections } from "@/components/portal-page";

/** Rename viewer-facing section titles without changing channel IDs, URLs or categories. */
export function ChannelCategoryNames() {
  const { data, isPending } = useSiteConfig();
  const qc = useQueryClient();
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data && !dirty) setTitles(data.sectionContent.titles ?? {});
  }, [data, dirty]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || busy) return;
    const clean = Object.fromEntries(liveSections.map((section) => [
      section.slug,
      (titles[section.slug] || section.title).trim().slice(0, 80),
    ]));
    if (Object.values(clean).some((name) => !name)) return setMessage("أسماء الأقسام لا يمكن أن تكون فارغة.");
    setBusy(true); setMessage("");
    const current = data.sectionContent;
    const { error } = await supabase.from("site_settings").upsert({
      key: "section-content",
      value: { ...current, titles: { ...current.titles, ...clean } },
      updated_at: new Date().toISOString(),
    });
    if (error) setMessage("تعذّر حفظ أسماء الأقسام. تحقق من صلاحيات الإدارة.");
    else {
      setDirty(false);
      await qc.invalidateQueries({ queryKey: siteConfigKey });
      setMessage("تم حفظ أسماء الأقسام ✓ وستظهر للزوار عند تحديث الصفحة.");
    }
    setBusy(false);
  }

  return <form onSubmit={(e) => { void save(e); }} className="space-y-4">
    <p className="text-sm text-muted-foreground">
      غيّر أسماء تصنيفات القنوات كما تظهر للزوار، دون تغيير روابط القنوات أو حذف أي قناة.
    </p>
    <div className="grid gap-3 sm:grid-cols-2">
      {liveSections.map((section) => <label key={section.slug} className="block space-y-2 rounded-xl border border-border bg-card/60 p-3">
        <span className="text-sm font-bold">اسم قسم {section.title}</span>
        <input required maxLength={80} value={titles[section.slug] ?? section.title}
          onChange={(event) => { setDirty(true); setMessage(""); setTitles((old) => ({ ...old, [section.slug]: event.target.value })); }}
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground" />
      </label>)}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={!dirty || busy || isPending || !data}>
        {busy ? "جارٍ الحفظ…" : "حفظ أسماء الأقسام"}
      </Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => {
        setTitles(Object.fromEntries(liveSections.map(s => [s.slug, s.title])));
        setDirty(true);
        setMessage("اضغط حفظ لاستعادة أسماء التصنيفات الأصلية.");
      }}>استعادة الأسماء الأصلية</Button>
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>;
}
