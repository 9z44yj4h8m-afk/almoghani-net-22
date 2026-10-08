import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VOICE_LIST, defaultVoiceChat, normalizeVoiceChat, type VoiceChatConfig } from "@/lib/voice-config";
import { defaultChatBots, type ChatBotsConfig } from "@/lib/chat-bots.functions";

const field = "h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none";

export function VoiceChatManager() {
  const [cfg, setCfg] = useState<VoiceChatConfig>(defaultVoiceChat);
  const [bots, setBots] = useState<string[]>(defaultChatBots.bots.map((b) => b.name));
  const [opener, setOpener] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.from("site_settings").select("key,value").in("key", ["voice_chat", "chat_bots"]).then(({ data }) => {
      for (const row of data ?? []) {
        if (row.key === "voice_chat") setCfg(normalizeVoiceChat(row.value));
        if (row.key === "chat_bots") { const b = (row.value as Partial<ChatBotsConfig>)?.bots; if (b?.length) setBots(b.map((x) => x.name)); }
      }
    });
  }, []);

  const update = (patch: Partial<VoiceChatConfig>) => { setCfg((c) => ({ ...c, ...patch })); setNote(""); };
  const toggle = (key: "maleVoices" | "femaleVoices", id: string) => update({ [key]: cfg[key].includes(id) ? cfg[key].filter((v) => v !== id) : [...cfg[key], id] });

  async function save() {
    setBusy(true);
    const next = normalizeVoiceChat(cfg);
    const { error } = await supabase.from("site_settings").upsert({ key: "voice_chat", value: next as never, updated_at: new Date().toISOString() });
    setBusy(false);
    if (!error) setCfg(next);
    setNote(error ? "تعذّر الحفظ؛ حاول مجددًا." : "تم حفظ إعدادات الشات الصوتي ✓");
  }

  return <section className="space-y-5 border-y border-border py-6" aria-label="الشات الصوتي">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-black">الشات الصوتي</h2>
      <Button type="button" disabled={busy} onClick={save}><Save />{busy ? "جارٍ الحفظ…" : "حفظ الشات الصوتي"}</Button>
    </div>
    {note && <p className="text-sm font-bold">{note}</p>}
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card/50 p-4">
      <span className="flex-1 font-bold">الشات الصوتي {cfg.enabled ? "مفعّل" : "متوقف"}</span>
      <Button variant={cfg.enabled ? "outline" : "default"} onClick={() => update({ enabled: !cfg.enabled })}>{cfg.enabled ? "إيقاف" : "تشغيل"}</Button>
      <label className="flex items-center gap-2 text-sm">مدة دور كل متحدث (ثانية)
        <input type="number" min={8} max={40} className={`${field} w-20`} value={cfg.turnSeconds} onChange={(e) => update({ turnSeconds: Number(e.target.value) })} />
      </label>
    </div>

    {(["maleVoices", "femaleVoices"] as const).map((key) => <div key={key} className="space-y-2">
      <h3 className="font-black">{key === "maleVoices" ? "أصوات الشباب" : "أصوات البنات"} <span className="text-sm font-normal text-muted-foreground">(اختر الأصوات المستخدمة)</span></h3>
      <div className="flex flex-wrap gap-2">
        {VOICE_LIST.filter((v) => v.female === (key === "femaleVoices")).map((v) => <Button key={v.id} type="button" size="sm" variant={cfg[key].includes(v.id) ? "default" : "outline"} aria-pressed={cfg[key].includes(v.id)} onClick={() => toggle(key, v.id)}>{v.id} · {v.label}</Button>)}
      </div>
    </div>)}

    <div className="space-y-2">
      <h3 className="font-black">صوت كل بوت</h3>
      <p className="text-sm text-muted-foreground">«تلقائي» يختار صوتًا مناسبًا للشخصية (شاب أو بنت).</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {bots.map((name) => <label key={name} className="flex items-center gap-2 rounded-xl border border-border p-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-bold">{name}</span>
          <select className={`${field} w-40`} value={cfg.botVoices[name] ?? ""} onChange={(e) => { const botVoices = { ...cfg.botVoices }; if (e.target.value) botVoices[name] = e.target.value; else delete botVoices[name]; update({ botVoices }); }}>
            <option value="">تلقائي</option>
            <optgroup label="شباب">{VOICE_LIST.filter((v) => !v.female).map((v) => <option key={v.id} value={v.id}>{v.id} · {v.label}</option>)}</optgroup>
            <optgroup label="بنات">{VOICE_LIST.filter((v) => v.female).map((v) => <option key={v.id} value={v.id}>{v.id} · {v.label}</option>)}</optgroup>
          </select>
        </label>)}
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="font-black">جمل الترحيب (أول متحدث)</h3>
      {cfg.openers.map((o, i) => <div key={i} className="flex items-center gap-2"><p className="flex-1 rounded-xl border border-border p-2 text-sm">{o}</p><Button type="button" size="icon" variant="outline" aria-label="حذف الجملة" onClick={() => update({ openers: cfg.openers.filter((_, j) => j !== i) })}><Trash2 /></Button></div>)}
      <div className="flex gap-2"><input className={field} value={opener} maxLength={300} placeholder="اكتب جملة ترحيب جديدة…" onChange={(e) => setOpener(e.target.value)} /><Button type="button" disabled={!opener.trim()} onClick={() => { update({ openers: [...cfg.openers, opener.trim()] }); setOpener(""); }}><Plus />إضافة</Button></div>
    </div>
    <p className="text-xs text-muted-foreground">لا تنسَ الضغط على «حفظ الشات الصوتي» بعد التعديل.</p>
  </section>;
}
