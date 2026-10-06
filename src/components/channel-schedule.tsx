import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; title: string; starts_at: string; ends_at: string | null };
const fmt = (d: string) => new Date(d).toLocaleString("ar-SA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ChannelSchedule({ channelId }: { channelId: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    const since = new Date(Date.now() - 3 * 3600_000).toISOString();
    void supabase.from("channel_schedules").select("id,title,starts_at,ends_at").eq("channel_id", channelId).gte("starts_at", since).order("starts_at").limit(50)
      .then(({ data }) => setItems(data ?? []));
  }, [channelId]);
  if (items === null) return <p>جارٍ تحميل الجدول…</p>;
  if (!items.length) return <p>لا توجد مواعيد بث مضافة لهذه القناة حاليًا.</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-4 py-3">
          <span className="font-bold text-foreground">{i.title}</span>
          <span className="shrink-0 text-xs">{fmt(i.starts_at)}{i.ends_at ? ` — ${new Date(i.ends_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
        </li>
      ))}
    </ul>
  );
}
