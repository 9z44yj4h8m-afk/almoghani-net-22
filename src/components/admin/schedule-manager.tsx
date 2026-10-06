import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { featuredChannels } from "@/lib/featured-channels";
import { Button } from "@/components/ui/button";

type Row = { id: string; channel_id: string; title: string; starts_at: string; ends_at: string | null };
const liveChannels = featuredChannels.filter((c) => c.kind === "live");

export function ScheduleManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ channel_id: liveChannels[0]?.id ?? "", title: "", starts_at: "", ends_at: "" });
  const [msg, setMsg] = useState("");

  const load = () => supabase.from("channel_schedules").select("*").gte("starts_at", new Date(Date.now() - 86400_000).toISOString()).order("starts_at").then(({ data }) => setRows((data as Row[]) ?? []));
  useEffect(() => { void load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.starts_at) return setMsg("أدخل اسم البرنامج ووقت البداية.");
    const { error } = await supabase.from("channel_schedules").insert({ channel_id: form.channel_id, title: form.title.trim().slice(0, 150), starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null });
    setMsg(error ? "تعذّر الحفظ." : "تمت الإضافة ✓");
    if (!error) { setForm({ ...form, title: "", starts_at: "", ends_at: "" }); void load(); }
  };
  const remove = async (id: string) => { await supabase.from("channel_schedules").delete().eq("id", id); void load(); };
  const input = "w-full rounded-xl border border-border bg-card px-3 py-2";

  return (
    <div>
      <div>
        <form onSubmit={add} className="mt-6 grid gap-3">
          <select className={input} value={form.channel_id} onChange={(e) => setForm({ ...form, channel_id: e.target.value })}>{liveChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input className={input} placeholder="اسم البرنامج أو المباراة" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="text-sm">البداية<input type="datetime-local" className={input} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
          <label className="text-sm">النهاية (اختياري)<input type="datetime-local" className={input} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
          <Button type="submit">إضافة موعد</Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>
        <ul className="mt-8 divide-y divide-border">
          {rows.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-3"><span><b>{r.title}</b><span className="block text-xs text-muted-foreground">{liveChannels.find((c) => c.id === r.channel_id)?.name} · {new Date(r.starts_at).toLocaleString("ar-SA")}</span></span><button onClick={() => remove(r.id)} aria-label="حذف"><Trash2 className="h-4 w-4 text-destructive" /></button></li>)}
        </ul>
      </div>
    </div>
  );
}
