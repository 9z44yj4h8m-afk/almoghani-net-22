import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, X, Save } from "lucide-react";
import { useMember } from "@/components/member-provider";
import { Button } from "@/components/ui/button";
import { ChannelOrderManager } from "./channel-order-manager";
import { ChannelImagesManager } from "./channel-images-manager";
import { SectionEditor } from "./section-editor";
import { ScheduleManager } from "./schedule-manager";
import { supabase } from "@/integrations/supabase/client";
import { channels as baseChannels, type Channel } from "@/lib/channels";
import { channelCategories, defaultTexts, defaultTicker, siteConfigKey, useSiteConfig } from "@/lib/site-config";

const input = "w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-foreground";
export function OwnerEditablePage({ children }: { children: (editChannel?: (channel: Channel) => void) => ReactNode }) {
  const { user, ready } = useMember();
  const { data: owner = false } = useQuery({
    queryKey: ["page-editor-owner", user?.id], enabled: ready && !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      return !error && !!data?.length;
    },
  });
  const [open, setOpen] = useState(false);
  const [channelId, setChannelId] = useState("");
  const authorized = ready && !!user && owner;
  return <>
    {authorized && <div className="flex justify-end px-3 pt-3"><Button variant={open ? "broadcast" : "outline"} aria-pressed={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Pencil />}{open ? "إنهاء التعديل" : "تعديل الصفحة"}</Button></div>}
    <div className={authorized && open ? "grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_600px]" : "min-w-0"}>
      <div className="min-w-0">{children(authorized && open ? (channel) => { setChannelId(channel.id); document.getElementById("page-channel-editor")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); } : undefined)}</div>
      {authorized && open && <aside aria-label="تعديل محتوى الصفحة" dir="rtl" className="mx-3 min-w-0 border-s border-border px-3 2xl:sticky 2xl:top-24 2xl:mx-0 2xl:max-h-[calc(100dvh-7rem)] 2xl:overflow-y-auto">
        <h2 className="py-3 text-xl font-black">تعديل محتوى الصفحة</h2>
        <div id="page-channel-editor" className="scroll-mt-24 border-t border-border py-5"><ChannelDetailsEditor channelId={channelId} onSelect={setChannelId} /></div>
        <section className="border-t border-border py-5"><ChannelOrderManager /></section>
        <section className="border-t border-border py-5"><ChannelImagesManager /></section>
        <section className="border-t border-border py-5"><PageTextsEditor /></section>
        <section className="border-t border-border py-5"><SectionEditor /></section>
        <section className="border-t border-border py-5"><ScheduleManager /></section>
      </aside>}
    </div>
  </>;
}
function ChannelDetailsEditor({ channelId, onSelect }: { channelId: string; onSelect: (id: string) => void }) {
  const { data } = useSiteConfig();
  const qc = useQueryClient();
  const all = [...baseChannels, ...(data?.customChannels ?? []).map(c => ({ id: c.id, name: c.name, category: c.category }))];
  const id = channelId || all[0]?.id || "";
  const channel = all.find(c => c.id === id);
  const override = data?.overrides.find(c => c.channel_id === id);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("عامة");
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setName(override?.name || channel?.name || ""); setCategory(override?.category || channel?.category || "عامة"); setHidden(override?.hidden ?? false); setMessage(""); }, [id, channel?.name, channel?.category, override?.name, override?.category, override?.hidden]);
  return <form className="space-y-3" onSubmit={async e => {
    e.preventDefault(); if (!id || !name.trim()) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.from("channel_overrides").upsert({ channel_id: id, name: name.trim(), category, hidden }, { onConflict: "channel_id" });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: siteConfigKey }); setMessage("تم حفظ القناة ✓");
    } catch { setMessage("تعذّر الحفظ؛ أعد المحاولة بحساب المالك."); } finally { setBusy(false); }
  }}>
    <h3 className="font-bold">اسم القناة وقسمها</h3>
    <label className="block">القناة<select aria-label="القناة المراد تعديلها" className={input} value={id} onChange={e => onSelect(e.target.value)}>{all.map(c => <option key={c.id} value={c.id}>{data?.overrides.find(o => o.channel_id === c.id)?.name || c.name}</option>)}</select></label>
    <label className="block">اسم القناة<input className={input} required maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>
    <label className="block">القسم<select className={input} value={category} onChange={e => setCategory(e.target.value)}>{channelCategories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={!hidden} onChange={e => setHidden(!e.target.checked)} />إظهار القناة</label>
    <Button disabled={busy} type="submit"><Save />حفظ القناة</Button>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>;
}
function PageTextsEditor() {
  const { data } = useSiteConfig();
  const qc = useQueryClient();
  const [texts, setTexts] = useState(defaultTexts);
  const [ticker, setTicker] = useState(defaultTicker);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setTexts(data.texts); setTicker(data.ticker); } }, [data]);
  return <form className="space-y-3" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const results = await Promise.all([
        supabase.from("site_settings").upsert({ key: "texts", value: { ...texts }, updated_at: new Date().toISOString() }),
        supabase.from("site_settings").upsert({ key: "ticker", value: { ...ticker }, updated_at: new Date().toISOString() }),
      ]);
      if (results.some(r => r.error)) throw new Error("save");
      await qc.invalidateQueries({ queryKey: siteConfigKey }); setMessage("تم حفظ النصوص ✓");
    } catch { setMessage("تعذّر حفظ النصوص؛ أعد المحاولة."); } finally { setBusy(false); }
  }}>
    <h3 className="font-bold">اسم الموقع وشريط العاجل</h3>
    <label className="block">اسم الموقع<input className={input} maxLength={40} value={texts.siteName ?? ""} placeholder="ALMOGHANI LIVE" onChange={e => setTexts({ ...texts, siteName: e.target.value })} /></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={ticker.enabled} onChange={e => setTicker({ ...ticker, enabled: e.target.checked })} />إظهار شريط العاجل</label>
    <label className="block">نص العاجل<textarea className={input} rows={3} maxLength={300} value={ticker.text} onChange={e => setTicker({ ...ticker, text: e.target.value })} /></label>
    <Button type="submit" disabled={busy}><Save />حفظ النصوص</Button>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>;
}
