import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { channelCategories, mergeChannels, siteConfigKey, useSiteConfig } from "@/lib/site-config";
import type { Channel, ChannelCategory } from "@/lib/channels";

/** Owner tool: reorder channels within a section and move a channel to another section. */
export function ChannelOrderManager() {
  const { data } = useSiteConfig();
  const qc = useQueryClient();
  const [cat, setCat] = useState<ChannelCategory>(channelCategories[0] as ChannelCategory);
  const [list, setList] = useState<Channel[]>([]);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const catalog = useMemo(() => mergeChannels(data), [data]);

  useEffect(() => { setList(catalog.filter((c) => c.category === cat)); setDirty(false); }, [catalog, cat]);

  function move(i: number, to: number) {
    if (to < 0 || to >= list.length || to === i) return;
    const next = [...list]; const [item] = next.splice(i, 1); if (item) next.splice(to, 0, item);
    setList(next); setDirty(true); setMsg("");
  }

  async function saveOrder() {
    setBusy(true); setMsg("");
    const rows = list.map((c, i) => ({ channel_id: c.id, sort_order: i }));
    const { error } = await supabase.from("channel_overrides").upsert(rows, { onConflict: "channel_id" });
    setBusy(false);
    if (error) { setMsg("تعذّر الحفظ؛ تأكد أنك داخل بحساب المالك."); return; }
    await qc.invalidateQueries({ queryKey: siteConfigKey });
    setDirty(false); setMsg("تم حفظ الترتيب ✓");
  }

  async function moveSection(c: Channel, to: string) {
    setBusy(true); setMsg("");
    const { error } = await supabase.from("channel_overrides").upsert({ channel_id: c.id, category: to, sort_order: null }, { onConflict: "channel_id" });
    setBusy(false);
    if (error) { setMsg("تعذّر النقل؛ تأكد أنك داخل بحساب المالك."); return; }
    await qc.invalidateQueries({ queryKey: siteConfigKey });
    setMsg(`نُقلت «${c.name}» إلى ${to} ✓`);
  }

  return <div className="space-y-4">
    <h2 className="text-xl font-bold">ترتيب القنوات</h2>
    <p className="text-sm text-muted-foreground">اختر القسم، ثم قدّم أو أخّر القنوات واضغط «حفظ الترتيب». تقدر تنقل أي قناة لقسم ثاني من القائمة بجانبها.</p>
    <div className="flex flex-wrap gap-2">{channelCategories.map((c) => <Button key={c} size="sm" variant={c === cat ? "default" : "outline"} onClick={() => setCat(c)}>{c}</Button>)}</div>
    <div className="sticky top-0 z-10 flex items-center gap-3 bg-background py-2">
      <Button disabled={!dirty || busy} onClick={() => void saveOrder()}>حفظ الترتيب</Button>
      {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
    </div>
    <ol className="space-y-2">
      {list.map((c, i) => <li key={c.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
        <span className="w-8 text-center font-bold text-primary">{i + 1}</span>
        {c.thumbnail ? <img src={c.thumbnail} alt="" className="h-10 w-14 shrink-0 rounded bg-background object-contain" /> : <span className="h-10 w-14 shrink-0 rounded bg-background" />}
        <span className="min-w-0 flex-1 truncate font-bold">{c.name}</span>
        <Button size="icon" variant="ghost" aria-label="إلى الأول" disabled={i === 0} onClick={() => move(i, 0)}><ChevronsUp /></Button>
        <Button size="icon" variant="ghost" aria-label="تقديم" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button>
        <Button size="icon" variant="ghost" aria-label="تأخير" disabled={i === list.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button>
        <Button size="icon" variant="ghost" aria-label="إلى الأخير" disabled={i === list.length - 1} onClick={() => move(i, list.length - 1)}><ChevronsDown /></Button>
        <select aria-label={`نقل ${c.name} إلى قسم`} value="" disabled={busy} onChange={(e) => e.target.value && void moveSection(c, e.target.value)} className="h-9 max-w-28 rounded-md border border-border bg-background px-1 text-xs text-foreground">
          <option value="">نقل إلى…</option>
          {channelCategories.filter((x) => x !== cat).map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </li>)}
    </ol>
  </div>;
}
