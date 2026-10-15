import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/components/member-provider";
import { previewVoice } from "@/lib/voice-preview.functions";
import { VOICE_LIST } from "@/lib/voice-config";
import camel from "@/assets/studio/camel.jpg";
import cat from "@/assets/studio/cat.jpg";
import grandpa from "@/assets/studio/grandpa.jpg";
import robot from "@/assets/studio/robot.jpg";

export const Route = createFileRoute("/studio")({
  ssr: false,
  head: () => ({ meta: [
    { title: "استوديو الفيديو المضحك — المغني لايف" },
    { name: "description", content: "اختر شخصية كرتونية واكتب كلامك لتصنع فيديو مضحك بالصوت والصورة." },
    { property: "og:title", content: "استوديو الفيديو المضحك — المغني لايف" },
    { property: "og:description", content: "شخصيات كرتونية تتكلم بصوتك المكتوب مع مؤثرات مضحكة وتحميل الفيديو." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: StudioPage,
});

const CHARACTERS = [
  { id: "camel", name: "الجمل الضاحك", img: camel, voice: "Puck" },
  { id: "cat", name: "القط الزعلان", img: cat, voice: "Algenib" },
  { id: "grandpa", name: "الجد أبو سالم", img: grandpa, voice: "Charon" },
  { id: "robot", name: "الروبوت المجنون", img: robot, voice: "Fenrir" },
];
const LOOKS = [
  { id: "normal", label: "عادي" }, { id: "bighead", label: "راس كبير" }, { id: "squash", label: "مضغوط" },
  { id: "mirror", label: "مقلوب" }, { id: "rainbow", label: "ألوان مجنونة" }, { id: "shake", label: "رجفة" },
];
const PITCH = [
  { id: 1, label: "طبيعي" }, { id: 1.45, label: "سنجاب" }, { id: 0.72, label: "عملاق" }, { id: 1.2, label: "سريع" },
];

function StudioPage() {
  const { user, ready } = useMember();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) { setAllowed(false); return; }
    void supabase.rpc("claim_owner_admin").then(async ({ data }) => {
      if (data) return setAllowed(true);
      const { data: s } = await supabase.from("member_library_sessions").select("unlocked").maybeSingle();
      setAllowed(s?.unlocked === true);
    });
  }, [user]);

  const [char, setChar] = useState(CHARACTERS[0]!);
  const [custom, setCustom] = useState<string | null>(null);
  const [text, setText] = useState("هلا والله! أنا نجم المغني لايف");
  const [voice, setVoice] = useState(CHARACTERS[0]!.voice);
  const [look, setLook] = useState("normal");
  const [pitch, setPitch] = useState(1);
  const [caption, setCaption] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [micBlob, setMicBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const micRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const levelRef = useRef(0);
  const stateRef = useRef({ look, caption, text, talking: false });
  stateRef.current = { look, caption, text, talking: stateRef.current.talking };

  useEffect(() => { const i = new Image(); i.src = custom ?? char.img; imgRef.current = i; }, [char, custom]);

  useEffect(() => {
    let raf = 0;
    const draw = (t: number) => {
      const c = canvasRef.current, img = imgRef.current;
      if (c && img?.complete) {
        const g = c.getContext("2d")!; const W = c.width, H = c.height; const s = stateRef.current;
        const lv = levelRef.current;
        g.save(); g.fillStyle = "#0b1230"; g.fillRect(0, 0, W, H);
        g.filter = s.look === "rainbow" ? `hue-rotate(${(t / 5) % 360}deg) saturate(2)` : "none";
        g.translate(W / 2, H / 2);
        if (s.look === "shake" || s.talking) g.translate((Math.random() - 0.5) * (s.look === "shake" ? 18 : lv * 10), (Math.random() - 0.5) * (s.look === "shake" ? 18 : 0));
        let sx = 1 + lv * 0.08, sy = 1 + lv * 0.12;
        if (s.look === "bighead") { sx *= 1.35; sy *= 1.35; }
        if (s.look === "squash") { sx *= 1.3; sy *= 0.7; }
        if (s.look === "mirror") sy *= -1;
        g.rotate(Math.sin(t / 300) * (s.talking ? 0.04 + lv * 0.08 : 0.015));
        g.scale(sx, sy);
        g.drawImage(img, -W / 2, -H / 2, W, H);
        g.restore();
        if (s.caption && s.text) {
          g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.direction = "rtl";
          g.lineWidth = 8; g.strokeStyle = "#000"; g.fillStyle = "#fff";
          const line = s.text.slice(0, 60);
          g.strokeText(line, W / 2, H - 40); g.fillText(line, W / 2, H - 40);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  async function toggleMic() {
    if (micRef.current) { micRef.current.stop(); return; }
    setErr("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(s); const parts: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && parts.push(e.data);
      r.onstop = () => { s.getTracks().forEach((t) => t.stop()); micRef.current = null; setRecording(false); setMicBlob(new Blob(parts, { type: r.mimeType })); };
      micRef.current = r; r.start(); setRecording(true);
    } catch { setErr("لم نتمكن من فتح المايك، اسمح للموقع باستخدامه من إعدادات المتصفح."); }
  }

  async function make() {
    setErr(""); setBusy(true); setVideoUrl(null);
    try {
      let raw: ArrayBuffer;
      if (micBlob) raw = await micBlob.arrayBuffer();
      else {
        try {
          const { audio } = await previewVoice({ data: { text: text.trim(), voice } });
          raw = Uint8Array.from(atob(audio), (ch) => ch.charCodeAt(0)).buffer;
        } catch (e) {
          const m = e instanceof Error ? e.message : "";
          throw new Error(/402|credit/i.test(m) ? "الصوت الآلي غير متاح حالياً. سجّل بصوتك من زر المايك 🎙️ واصنع الفيديو مجاناً." : "تعذر توليد الصوت، جرّب التسجيل بصوتك من زر المايك 🎙️.");
        }
      }
      const ctx = new AudioContext();
      const buf = await ctx.decodeAudioData(raw);
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = pitch;
      const an = ctx.createAnalyser(); an.fftSize = 512;
      const dest = ctx.createMediaStreamDestination();
      src.connect(an); an.connect(ctx.destination); an.connect(dest);
      const data = new Uint8Array(an.fftSize);
      let on = true;
      const meter = () => { if (!on) return; an.getByteTimeDomainData(data); let m = 0; for (const v of data) m = Math.max(m, Math.abs(v - 128)); levelRef.current = Math.min(1, m / 50); requestAnimationFrame(meter); };
      const stream = new MediaStream([...canvasRef.current!.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const type = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => { setVideoUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }))); void ctx.close(); };
      stateRef.current.talking = true; meter(); rec.start();
      src.onended = () => setTimeout(() => { on = false; levelRef.current = 0; stateRef.current.talking = false; rec.stop(); setBusy(false); }, 400);
      src.start();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر صنع الفيديو"); setBusy(false);
    }
  }

  if (!ready || allowed === null) return null;
  if (!allowed) return <div dir="rtl" className="min-h-screen grid place-items-center p-6 text-center">
    <div className="space-y-4"><h1 className="font-display text-2xl font-black">استوديو الفيديو للأعضاء</h1>
      <Link to="/unlock" search={{ to: "/studio" }} className="inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">فتح بالرقم السري</Link></div>
  </div>;

  const chip = (active: boolean) => `rounded-full border px-3 py-1.5 text-sm font-bold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-foreground"}`;
  return <div dir="rtl" className="mx-auto max-w-3xl space-y-5 p-4 pb-28">
    <h1 className="font-display text-3xl font-black text-primary">استوديو الفيديو المضحك</h1>
    <canvas ref={canvasRef} width={720} height={720} className="w-full rounded-2xl border border-border" />
    <section className="space-y-2"><h2 className="font-bold">الشخصية</h2>
      <div className="grid grid-cols-4 gap-2">{CHARACTERS.map((c) => <button key={c.id} type="button" onClick={() => { setChar(c); setCustom(null); setVoice(c.voice); }} className={`overflow-hidden rounded-xl border-2 ${char.id === c.id && !custom ? "border-primary" : "border-border"}`}>
        <img src={c.img} alt={c.name} loading="lazy" width={816} height={816} className="aspect-square w-full object-cover" /><span className="block p-1 text-xs font-bold">{c.name}</span></button>)}</div>
      <label className="inline-block cursor-pointer rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-bold">📷 صورتك الخاصة
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCustom(URL.createObjectURL(f)); }} /></label>
    </section>
    <section className="space-y-2"><h2 className="font-bold">الكلام</h2>
      <textarea value={text} maxLength={400} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background p-3" />
      <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2">
        {VOICE_LIST.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.label}</option>)}</select>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggleMic} className={`rounded-xl px-4 py-2 text-sm font-bold ${recording ? "bg-destructive text-destructive-foreground animate-pulse" : "border border-border bg-secondary"}`}>{recording ? "⏹️ إيقاف التسجيل" : "🎙️ سجّل بصوتك"}</button>
        {micBlob && !recording && <><span className="text-sm text-primary font-bold">✓ سيُستخدم صوتك المسجل</span>
          <button type="button" onClick={() => setMicBlob(null)} className="text-sm underline">حذف التسجيل</button></>}
      </div>
    </section>
    <section className="space-y-2"><h2 className="font-bold">شكل مضحك</h2>
      <div className="flex flex-wrap gap-2">{LOOKS.map((l) => <button key={l.id} type="button" className={chip(look === l.id)} onClick={() => setLook(l.id)}>{l.label}</button>)}</div>
      <h2 className="font-bold">نبرة الصوت</h2>
      <div className="flex flex-wrap gap-2">{PITCH.map((p) => <button key={p.label} type="button" className={chip(pitch === p.id)} onClick={() => setPitch(p.id)}>{p.label}</button>)}</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={caption} onChange={(e) => setCaption(e.target.checked)} /> إظهار الكلام على الفيديو</label>
    </section>
    {err && <p className="text-sm text-destructive">{err}</p>}
    <button type="button" disabled={busy || !text.trim()} onClick={make} className="w-full rounded-xl bg-primary py-3 text-lg font-black text-primary-foreground disabled:opacity-50">{busy ? "جاري التسجيل…" : "🎬 اصنع الفيديو"}</button>
    {videoUrl && <div className="space-y-2"><video src={videoUrl} controls playsInline className="w-full rounded-2xl" />
      <a href={videoUrl} download={`almoghani-funny.${videoUrl && /mp4/.test(videoUrl) ? "mp4" : "webm"}`} className="block rounded-xl border border-border bg-secondary py-3 text-center font-bold">⬇️ تحميل الفيديو</a></div>}
  </div>;
}
