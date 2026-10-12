import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Download, Music2, Play, Plus, Save, Trash2, Upload, UserRound, AudioLines } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MELODIES, RHYTHMS, VOICE_LIST, defaultVoiceChat, normalizeVoiceChat, type VoiceChatConfig } from "@/lib/voice-config";
import { defaultChatBots, type ChatBotsConfig } from "@/lib/chat-bots.functions";
import { previewVoice } from "@/lib/voice-preview.functions";

const field = "h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none";

export function SayNowForm() {
  const [cfg, setCfg] = useState<VoiceChatConfig>(defaultVoiceChat);
  const [bots, setBots] = useState<string[]>(defaultChatBots.bots.map((b) => b.name));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sayBot, setSayBot] = useState("");
  const [sayText, setSayText] = useState("");
  const [sayVoice, setSayVoice] = useState("Leda");
  const [sing, setSing] = useState(false);
  const [melody, setMelody] = useState("najdi");
  const [rhythm, setRhythm] = useState("slow");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const previewVoiceFn = useServerFn(previewVoice);
  useEffect(() => {
    if (!audioFile) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  async function downloadVoice() {
    if (!audioFile) return;
    try {
      if (navigator.canShare?.({ files: [audioFile] })) {
        await navigator.share({ files: [audioFile], title: "صوت المغني" });
        return;
      }
      const url = URL.createObjectURL(audioFile);
      const link = document.createElement("a");
      link.href = url; link.download = audioFile.name;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setNote("تم طلب تنزيل المقطع الصوتي ✓");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNote("تعذّر تنزيل الصوت؛ حاول مجددًا.");
    }
  }

  async function saveVoice() {
    const name = sayBot || bots[0];
    if (!name || busy) return;
    setBusy(true); setNote("");
    try {
      const { data, error: readError } = await supabase.from("site_settings").select("value").eq("key", "voice_chat").maybeSingle();
      if (readError) throw readError;
      const current = normalizeVoiceChat(data?.value);
      const botVoices = { ...current.botVoices };
      if (sayVoice) botVoices[name] = sayVoice;
      else delete botVoices[name];
      const next = normalizeVoiceChat({ ...current, botVoices });
      const { error } = await supabase.from("site_settings").upsert({ key: "voice_chat", value: next as never, updated_at: new Date().toISOString() });
      if (error) throw error;
      setCfg(next);
      setNote(`تم حفظ صوت ${name} ✓`);
    } catch { setNote("تعذّر حفظ الصوت؛ حاول مجددًا."); }
    finally { setBusy(false); }
  }

  async function testVoice() {
    if (testing) return;
    const name = sayBot || bots[0] || "";
    setTesting(true); setNote(""); setAudioFile(null);
    const text = sayText.trim() || "هلا والله، هذي تجربة للصوت من لوحة التحكم";
    const selected = sayVoice || cfg.botVoices[name];
    const voiceId = VOICE_LIST.find((v) => v.id === selected && v.female)?.id ?? "Leda";
    try {
      const { audio } = await previewVoiceFn({ data: { text, voice: voiceId, sing, melody, rhythm } });
      const bytes = Uint8Array.from(atob(audio), (char) => char.charCodeAt(0));
      setAudioFile(new File([bytes], `almoghani-voice-${Date.now()}.wav`, { type: "audio/wav" }));
      await new Audio(`data:audio/wav;base64,${audio}`).play();
      setNote("هذا هو الصوت اللي اخترته ✓");
    } catch {
      // Free on-device fallback when the cloud voice is unavailable (e.g. no AI credits).
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ar-SA";
        const ar = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("ar"));
        if (ar) u.voice = ar;
        u.pitch = 1.4;
        u.rate = 0.95;
        synth.speak(u);
        setNote("تعذّر الصوت السحابي؛ اشتغل قارئ جهازك المجاني، ولا يمكن حفظ صوته كملف.");
      } else setNote("تعذّر تجريب الصوت.");
    }
    finally { setTesting(false); }
  }

  useEffect(() => {
    let alive = true;
    void supabase.from("site_settings").select("key,value").in("key", ["voice_chat", "chat_bots"]).then(({ data }) => {
      if (!alive) return;
      for (const row of data ?? []) {
        if (row.key === "voice_chat") setCfg(normalizeVoiceChat(row.value));
        if (row.key === "chat_bots") { const b = (row.value as Partial<ChatBotsConfig>)?.bots; if (b?.length) setBots(b.map((x) => x.name)); }
      }
    });
    return () => { alive = false; };
  }, []);

  return <section aria-label="تجريب أصوات البنات" className="voice-studio-panel">
    <h2 className="voice-studio-heading"><AudioLines aria-hidden="true" />تجربة أصوات البوت</h2>
    <div className="voice-studio-form">
      <label className="voice-studio-field"><span>صوت البوت</span><div className="voice-studio-select"><UserRound aria-hidden="true" /><select aria-label="البوت المتحدث" value={sayBot || bots[0] || ""} onChange={(e) => setSayBot(e.target.value)}>{bots.map((b) => <option key={b} value={b}>{b}</option>)}</select><ChevronDown aria-hidden="true" /></div></label>
      <label className="voice-studio-field"><span>نص التجربة</span><textarea aria-label="الكلام" maxLength={400} placeholder="اكتب الكلام اللي يقوله البوت بصوته" value={sayText} onChange={(e) => { setSayText(e.target.value); setAudioFile(null); }} /></label>
      <label className="voice-studio-field"><span>اختيار صوت بنت</span><div className="voice-studio-select voice-studio-female"><UserRound aria-hidden="true" /><select aria-label="صوت هذه الجملة" value={sayVoice} onChange={(e) => { setSayVoice(e.target.value); setAudioFile(null); }}>
        <optgroup label="أصوات بنات ناعمة وحنونة">{VOICE_LIST.filter((v) => v.female && !v.providerId).map((v) => <option key={v.id} value={v.id}>أنثى · {v.name} ({v.label})</option>)}</optgroup>
        <optgroup label="طبقات وأداء جديد للبنات">{VOICE_LIST.filter((v) => v.female && v.providerId).map((v) => <option key={v.id} value={v.id}>أنثى · {v.name} ({v.label})</option>)}</optgroup>
      </select><ChevronDown aria-hidden="true" /></div></label>
      <label className="voice-studio-sing"><Music2 aria-hidden="true" /><span>خلّها تغني الكلام بدل ما تقوله</span><Switch dir="ltr" checked={sing} onCheckedChange={(value) => { setSing(value); setAudioFile(null); }} aria-label="خلّها تغني الكلام بدل ما تقوله" /></label>
      {sing && <div className="grid gap-2 sm:grid-cols-2">
        <select className={field} aria-label="اللحن" value={melody} onChange={(e) => { setMelody(e.target.value); setAudioFile(null); }}>{MELODIES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
        <select className={field} aria-label="الإيقاع والرقصة" value={rhythm} onChange={(e) => { setRhythm(e.target.value); setAudioFile(null); }}>{RHYTHMS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
      </div>}
      <div className="voice-studio-preview">{audioUrl ? <audio controls src={audioUrl} aria-label="معاينة الصوت المولد" /> : <><Button size="icon" variant="outline" aria-label="تشغيل تجربة الصوت" disabled={testing} onClick={testVoice} className="voice-studio-play"><Play /></Button><span className="voice-studio-status" role="status">{testing ? "جارٍ التجريب…" : "جاهز للتجربة"}</span><div className="voice-studio-wave" aria-hidden="true">{Array.from({ length: 43 }, (_, i) => <i key={i} />)}</div></>}</div>
      <div className="voice-studio-actions">
        <Button type="button" variant="outline" disabled={testing} onClick={testVoice} className="voice-studio-test"><Play />{testing ? "جارٍ التجريب…" : "تجريب الصوت"}</Button>
        <Button type="button" variant="outline" disabled={!audioFile || testing} onClick={downloadVoice} className="voice-studio-download"><Download />حفظ الصوت في جوالي</Button>
      </div>
      {note && <p role="status" className="text-sm font-bold">{note}</p>}
      <Button type="button" disabled={busy || testing} onClick={saveVoice} className="voice-studio-save"><Save />{busy ? "جارٍ الحفظ…" : "حفظ اختيار البوت"}</Button>
    </div>
  </section>;
}

export function VoiceChatManager() {
  const [cfg, setCfg] = useState<VoiceChatConfig>(defaultVoiceChat);
  const [bots, setBots] = useState<string[]>(defaultChatBots.bots.map((b) => b.name));
  const [opener, setOpener] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [clipName, setClipName] = useState("");
  const [clipFile, setClipFile] = useState<File | null>(null);

  useEffect(() => {
    let alive = true;
    for (const clip of cfg.clips) void supabase.storage.from("chat-recordings").createSignedUrl(clip.path, 3600).then(({ data }) => {
      if (alive) setPreviews((v) => ({ ...v, [clip.id]: data?.signedUrl ?? "" }));
    });
    return () => { alive = false; };
  }, [cfg.clips]);

  async function persistClips(next: VoiceChatConfig, removedPath?: string) {
    const { error } = await supabase.from("site_settings").upsert({ key: "voice_chat", value: normalizeVoiceChat(next) as never, updated_at: new Date().toISOString() });
    if (error) throw error;
    setCfg(normalizeVoiceChat(next));
    if (removedPath) await supabase.storage.from("chat-recordings").remove([removedPath]);
  }

  async function addClip(e: React.FormEvent) {
    e.preventDefault();
    if (!clipFile || !clipName.trim()) return;
    const ext = clipFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp3", "wav", "m4a", "ogg", "webm"].includes(ext) || !clipFile.type.startsWith("audio/") || clipFile.size > 20 * 1024 * 1024) { setNote("اختر ملف صوت بحجم أقل من 20 ميجابايت."); return; }
    setUploading(true); const path = `recordings/${crypto.randomUUID()}.${ext}`;
    try {
      const { error } = await supabase.storage.from("chat-recordings").upload(path, clipFile, { contentType: clipFile.type });
      if (error) throw error;
      try { await persistClips({ ...cfg, clips: [...cfg.clips, { id: crypto.randomUUID(), name: clipName.trim(), path, enabled: true }] }); }
      catch (error) { await supabase.storage.from("chat-recordings").remove([path]); throw error; }
      setClipName(""); setClipFile(null); setNote("تمت إضافة الصوت وحفظه ✓");
    } catch { setNote("تعذّر إضافة الصوت."); } finally { setUploading(false); }
  }

  useEffect(() => {
    let alive = true;
    for (const key of ["song", "poem"] as const) {
      const path = cfg.recordings[key];
      if (!path) { setPreviews((v) => ({ ...v, [key]: "" })); continue; }
      void supabase.storage.from("chat-recordings").createSignedUrl(path, 3600).then(({ data }) => {
        if (alive) setPreviews((v) => ({ ...v, [key]: data?.signedUrl ?? "" }));
      });
    }
    return () => { alive = false; };
  }, [cfg.recordings.song, cfg.recordings.poem]);

  async function uploadRecording(key: "song" | "poem", file?: File) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp3", "wav", "m4a", "ogg", "webm"].includes(ext) || !file.type.startsWith("audio/") || file.size > 20 * 1024 * 1024) {
      setNote("اختر تسجيل MP3 أو WAV أو M4A أو OGG أو WebM بحجم لا يتجاوز 20 ميجابايت."); return;
    }
    setUploading(true); setNote("");
    const path = `recordings/${crypto.randomUUID()}.${ext}`;
    try {
      const { error } = await supabase.storage.from("chat-recordings").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const next = normalizeVoiceChat({ ...cfg, recordings: { ...cfg.recordings, [key]: path } });
      const { error: saveError } = await supabase.from("site_settings").upsert({ key: "voice_chat", value: next as never, updated_at: new Date().toISOString() });
      if (saveError) { await supabase.storage.from("chat-recordings").remove([path]); throw saveError; }
      const old = cfg.recordings[key]; setCfg(next);
      if (old) await supabase.storage.from("chat-recordings").remove([old]);
      setNote("تم رفع التسجيل وحفظه ✓");
    } catch { setNote("تعذّر رفع التسجيل وحفظه؛ حاول مجددًا."); }
    finally { setUploading(false); }
  }

  async function removeRecording(key: "song" | "poem") {
    const path = cfg.recordings[key]; setUploading(true);
    const next = normalizeVoiceChat({ ...cfg, recordings: { ...cfg.recordings, [key]: "" } });
    try {
      const { error } = await supabase.from("site_settings").upsert({ key: "voice_chat", value: next as never, updated_at: new Date().toISOString() });
      if (error) throw error;
      setCfg(next); if (path) await supabase.storage.from("chat-recordings").remove([path]);
      setNote("تم حذف التسجيل ✓");
    } catch { setNote("تعذّر حذف التسجيل."); }
    finally { setUploading(false); }
  }

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
      <Button type="button" disabled={busy || uploading} onClick={save}><Save />{busy ? "جارٍ الحفظ…" : "حفظ الشات الصوتي"}</Button>
    </div>
    {note && <p className="text-sm font-bold">{note}</p>}
    <div className="space-y-4">
      <h3 className="font-black">مكتبة التسجيلات ({cfg.clips.length})</h3>
      <form onSubmit={addClip} className="grid gap-3 sm:grid-cols-2">
        <input className={field} aria-label="اسم الصوت أو المتحدث" required maxLength={40} placeholder="اسم الصوت أو المتحدث" value={clipName} onChange={(e) => setClipName(e.target.value)} />
        <input aria-label="ملف الصوت الجديد" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm" onChange={(e) => setClipFile(e.target.files?.[0] ?? null)} />
        <Button type="submit" disabled={busy || uploading || !clipFile || !clipName.trim() || cfg.clips.length >= 100}><Upload />إضافة وحفظ الصوت</Button>
      </form>
      <ul className="divide-y divide-border">{cfg.clips.map((clip) => <li key={clip.id} className="space-y-2 py-3">
        <div className="flex flex-wrap items-center gap-2"><b className="min-w-0 flex-1 break-words">{clip.name}</b><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={clip.enabled} disabled={busy || uploading} onChange={async (e) => { try { await persistClips({ ...cfg, clips: cfg.clips.map((c) => c.id === clip.id ? { ...c, enabled: e.target.checked } : c) }); setNote("تم حفظ التفعيل ✓"); } catch { setNote("تعذّر الحفظ."); } }} />تشغيل</label><Button type="button" size="icon" variant="outline" aria-label={`حذف صوت ${clip.name}`} disabled={busy || uploading} onClick={async () => { if (!confirm("حذف هذا التسجيل؟")) return; setUploading(true); try { await persistClips({ ...cfg, clips: cfg.clips.filter((c) => c.id !== clip.id) }, clip.path); setNote("تم حذف الصوت ✓"); } catch { setNote("تعذّر الحذف."); } finally { setUploading(false); } }}><Trash2 /></Button></div>
        {previews[clip.id] && <audio controls preload="none" src={previews[clip.id]} aria-label={`معاينة ${clip.name}`} className="w-full" />}
      </li>)}</ul>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {(["song", "poem"] as const).map((key) => <div key={key} className="space-y-3 border border-border p-4 rounded-lg">
        <h3 className="font-black">{key === "song" ? "تسجيل نغم · الغناء" : "تسجيل قصيدة · الشعر"}</h3>
        <p className="text-sm text-muted-foreground">{cfg.recordings[key] ? "تسجيل محفوظ" : "لم يرفع تسجيل بعد"}</p>
        {previews[key] && <audio controls preload="metadata" src={previews[key]} className="w-full" aria-label={`معاينة تسجيل ${key === "song" ? "نغم" : "قصيدة"}`} />}
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={busy || uploading} onClick={() => document.getElementById(`recording-${key}`)?.click()}><Upload />{cfg.recordings[key] ? "استبدال التسجيل" : "رفع تسجيل"}</Button>
          <input id={`recording-${key}`} className="hidden" type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg,audio/webm,.mp3,.m4a" aria-label={`تسجيل ${key === "song" ? "نغم" : "قصيدة"}`} onChange={(e) => { void uploadRecording(key, e.target.files?.[0]); e.target.value = ""; }} />
          {cfg.recordings[key] && <Button type="button" variant="outline" size="icon" disabled={busy || uploading} aria-label={`حذف تسجيل ${key}`} onClick={() => void removeRecording(key)}><Trash2 /></Button>}
        </div>
      </div>)}
    </div>
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card/50 p-4">
      <span className="flex-1 font-bold">الشات الصوتي {cfg.enabled ? "مفعّل" : "متوقف"}</span>
      <Button variant={cfg.enabled ? "outline" : "default"} onClick={() => update({ enabled: !cfg.enabled })}>{cfg.enabled ? "إيقاف" : "تشغيل"}</Button>
      <label className="flex items-center gap-2 text-sm">مدة دور كل متحدث (ثانية)
        <input type="number" min={8} max={40} className={`${field} w-20`} value={cfg.turnSeconds} onChange={(e) => update({ turnSeconds: Number(e.target.value) })} />
      </label>
    </div>

    {(["femaleVoices"] as const).map((key) => <div key={key} className="space-y-2">
      <h3 className="font-black">أصوات البنات <span className="text-sm font-normal text-muted-foreground">(اختر الأصوات المستخدمة)</span></h3>
      <div className="flex flex-wrap gap-2">
        {VOICE_LIST.filter((v) => v.female === (key === "femaleVoices")).map((v) => <Button key={v.id} type="button" size="sm" variant={cfg[key].includes(v.id) ? "default" : "outline"} aria-pressed={cfg[key].includes(v.id)} onClick={() => toggle(key, v.id)}>{v.name} · {v.label}</Button>)}
      </div>
    </div>)}

    <div className="space-y-2">
      <h3 className="font-black">صوت كل بوت</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {bots.map((name) => <label key={name} className="flex items-center gap-2 rounded-xl border border-border p-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-bold">{name}</span>
          <select className={`${field} w-40`} value={VOICE_LIST.some((v) => v.id === cfg.botVoices[name] && v.female) ? cfg.botVoices[name] : ""} onChange={(e) => { const botVoices = { ...cfg.botVoices }; if (e.target.value) botVoices[name] = e.target.value; else delete botVoices[name]; update({ botVoices }); }}>
            <option value="">تلقائي</option>
            <optgroup label="بنات">{VOICE_LIST.filter((v) => v.female).map((v) => <option key={v.id} value={v.id}>{v.name} · {v.label}</option>)}</optgroup>
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

