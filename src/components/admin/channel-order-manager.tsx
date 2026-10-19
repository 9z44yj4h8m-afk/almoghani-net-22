import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { channelCategories, mergeChannels, siteConfigKey, useSiteConfig } from "@/lib/site-config";
import type { Channel } from "@/lib/channels";

const ALL = "جميع القنوات";

/** Owner tool: reorder the full homepage list or channels within a section, and move a channel to another section. */
export function ChannelOrderManager() {
  const { data } = useSiteConfig();
  const qc = useQueryClient();
  const [cat, setCat] = useState<string>(ALL);
  const [list, setList] = useState<Channel[]>([]);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const catalog = useMemo(() => mergeChannels(data), [data]);

  useEffect(() => { setList(cat === ALL ? catalog : catalog.filter((c) => c.category === cat)); setDirty(false); }, [catalog, cat]);

  function move(i: number, to: number) {
    if (to < 0 || to >= list.length || to === i) return;
    const next = [...list]; const [item] = next.splice(i, 1); if (item) next.splice(to, 0, item);
    setList(next); setDirty(true); setMsg("");
  }

  async function saveOrder() {
    setBusy(true); setMsg("");
    // Build the full ordered catalog: section edits fill that section's existing slots.
    let full: Channel[];
    if (cat === ALL) full = list;
    else { let k = 0; full = catalog.map((c) => (c.category === cat ? list[k++] ?? c : c)); }
    const rows = full.map((c, i) => ({ channel_id: c.id, sort_order: i }));
    const { error } = await supabase.from("channel_overrides").upsert(rows, { onConflict: "channel_id" });
    setBusy(false);
    if (error) { setMsg("تعذّر الحفظ؛ تأكد أنك داخل بحساب المالك."); return; }
    await qc.invalidateQueries({ queryKey: siteConfigKey });
    setDirty(false); setMsg("تم حفظ الترتيب ✓");
  }

  async function moveSection(c: Channel, to: string) {
    setBusy(true); setMsg("");
    const { error } = await supabase.from("channel_overrides").upsert({ channel_id: c.id, category: to }, { onConflict: "channel_id" });
    setBusy(false);
    if (error) { setMsg("تعذّر النقل؛ تأكد أنك داخل بحساب المالك."); return; }
    await qc.invalidateQueries({ queryKey: siteConfigKey });
    setMsg(`نُقلت «${c.name}» إلى ${to} ✓`);
  }

  const needle = q.trim().toLocaleLowerCase();

  return <div className="space-y-4">
    <h2 className="text-xl font-bold">ترتيب القنوات</h2>
    <p className="text-sm text-muted-foreground">اختر «جميع القنوات» لترتيب القائمة كما تظهر في الصفحة الرئيسية، أو اختر قسمًا. قدّم أو أخّر أو اكتب رقم المكان، ثم اضغط «حفظ الترتيب».</p>
    <div className="flex flex-wrap gap-2">{[ALL, ...channelCategories].map((c) => <Button key={c} size="sm" variant={c === cat ? "default" : "outline"} onClick={() => setCat(c)}>{c}</Button>)}</div>
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-background py-2">
      <Button disabled={!dirty || busy} onClick={() => void saveOrder()}>حفظ الترتيب</Button>
      <input aria-label="بحث عن قناة" placeholder="بحث عن قناة…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground" />
      {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
    </div>
    <ol className="max-h-96 space-y-2 overflow-y-auto">
      {list.map((c, i) => (needle && !c.name.toLocaleLowerCase().includes(needle)) ? null : <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        <input type="number" min={1} max={list.length} aria-label={`مكان ${c.name}`} defaultValue={i + 1} key={`${c.id}-${i}`}
          onBlur={(e) => { const n = Number(e.target.value); if (n >= 1) move(i, Math.min(n, list.length) - 1); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="h-9 w-14 rounded-md border border-border bg-background text-center font-bold text-primary" />
        {c.thumbnail ? <img src={c.thumbnail} alt="" className="h-10 w-14 shrink-0 rounded bg-background object-contain" /> : <span className="h-10 w-14 shrink-0 rounded bg-background" />}
        <span className="min-w-0 flex-1 truncate font-bold">{c.name}{cat === ALL && <span className="ms-2 text-xs font-normal text-muted-foreground">{c.category}</span>}</span>
        <Button size="icon" variant="ghost" aria-label="إلى الأول" disabled={i === 0} onClick={() => move(i, 0)}><ChevronsUp /></Button>
        <Button size="icon" variant="ghost" aria-label="تقديم" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button>
        <Button size="icon" variant="ghost" aria-label="تأخير" disabled={i === list.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button>
        <Button size="icon" variant="ghost" aria-label="إلى الأخير" disabled={i === list.length - 1} onClick={() => move(i, list.length - 1)}><ChevronsDown /></Button>
        <select aria-label={`نقل ${c.name} إلى قسم`} value="" disabled={busy} onChange={(e) => e.target.value && void moveSection(c, e.target.value)} className="h-9 max-w-28 rounded-md border border-border bg-background px-1 text-xs text-foreground">
          <option value="">نقل إلى…</option>
          {channelCategories.filter((x) => x !== c.category).map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </li>)}
    </ol>
  </div>;
}
