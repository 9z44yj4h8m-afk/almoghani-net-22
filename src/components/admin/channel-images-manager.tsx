import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { channels as baseChannels } from "@/lib/channels";
import { mergeChannels, siteConfigKey, useSiteConfig } from "@/lib/site-config";

/** Shrinks an uploaded picture to a small WebP data URL so it can be saved with the channel override. */
async function toSmallImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 400 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

export function ChannelImagesManager() {
  const { data } = useSiteConfig();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef("");
  const list = useMemo(() => mergeChannels(data).filter((c) => !q || c.name.includes(q)).slice(0, 80), [data, q]);
  const custom = (id: string) => typeof data?.overrides.find((o) => o.channel_id === id)?.logo === "string";

  async function save(id: string, logo: string | null, done: string) {
    setBusy(id); setMsg("");
    const { error } = await supabase.from("channel_overrides").upsert({ channel_id: id, logo }, { onConflict: "channel_id" });
    setBusy("");
    if (error) { setMsg("تعذّر الحفظ؛ تأكد أنك داخل بحساب المالك."); return; }
    await qc.invalidateQueries({ queryKey: siteConfigKey });
    setMsg(done);
  }
  function pick(id: string) { target.current = id; fileRef.current?.click(); }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !target.current) return;
    if (!f.type.startsWith("image/")) { setMsg("اختر ملف صورة."); return; }
    try { await save(target.current, await toSmallImage(f), "تم حفظ الصورة ✓"); } catch { setMsg("تعذّر قراءة الصورة."); }
  }

  return <div className="space-y-4">
    <h2 className="text-xl font-bold">صور القنوات</h2>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    <input aria-label="ابحث عن قناة" placeholder="ابحث عن قناة…" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground" />
    {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
    <ul className="grid gap-3 sm:grid-cols-2">
      {list.map((c) => <li key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        {c.thumbnail ? <img src={c.thumbnail} alt="" className="h-14 w-20 shrink-0 rounded-md bg-background object-contain" /> : <div className="grid h-14 w-20 shrink-0 place-items-center rounded-md bg-background text-xs text-muted-foreground">بلا صورة</div>}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate font-bold">{c.name}</p>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => pick(c.id)}>{c.thumbnail ? <><RefreshCw />تغيير صورة</> : <><ImagePlus />إضافة صورة</>}</Button>
            {c.thumbnail && <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => void save(c.id, "", "تم حذف الصورة ✓")}><Trash2 />حذف صورة</Button>}
            {custom(c.id) && baseChannels.some((b) => b.id === c.id) && <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => void save(c.id, null, "رجعت الصورة الأصلية ✓")}><RotateCcw />الأصلية</Button>}
          </div>
        </div>
      </li>)}
    </ul>
  </div>;
}
