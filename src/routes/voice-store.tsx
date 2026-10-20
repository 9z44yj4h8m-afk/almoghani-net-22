import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Save, RotateCcw, X, Globe, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import template from "@/lib/voice-store.html?raw";

export const Route = createFileRoute("/voice-store")({
  head: () => ({
    meta: [
      { title: "متجر ALMOGHANI VOICE" },
      { name: "description", content: "اشتراكات ALMOGHANI VOICE: شهر، شهران، ثلاثة أشهر." },
      { property: "og:title", content: "متجر ALMOGHANI VOICE" },
      { property: "og:description", content: "اختر مدة اشتراكك وأرسل طلبك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VoiceStore,
});

type Cfg = { title: string; hero: string; p1: string; p2: string; p3: string; support: string; whatsapp: string; image: string };
const defaults: Cfg = {
  title: "ALMOGHANI VOICE",
  hero: "اختر مدة اشتراكك، أرسل طلبك، واستعد لتجربة صوتية بطابعك الخاص. واجهة مستوحاة من ألوان الموسيقى والنيون في الثمانينات والتسعينات.",
  p1: "يحدد عند الطلب", p2: "يحدد عند الطلب", p3: "يحدد عند الطلب",
  support: "للتواصل والدعم: واتساب 0557073007",
  whatsapp: "966557073007",
  image: "",
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const KEY = "voice_store";

function build(c: Cfg) {
  let h = template;
  h = h.replaceAll("ALMOGHANI VOICE", esc(c.title));
  h = h.replace(defaults.hero, esc(c.hero));
  const prices = [c.p1, c.p2, c.p3]; let i = 0;
  h = h.replace(/<div class="price">يحدد عند الطلب/g, () => `<div class="price">${esc(prices[i++] ?? "")}`);
  h = h.replace("للتواصل والدعم: أضف رابط حسابك أو رقم الدعم هنا", esc(c.support));
  h = h.replace('src="assets/jukebox.jpeg"', `src="${c.image ? esc(c.image) : "data:image/gif;base64,R0lGODlhAQABAAAAACw="}"`);
  const wa = c.whatsapp.replace(/\D/g, "");
  h = h.replace("toast('تم تجهيز طلبك التجريبي — اربط زر الإرسال بقناة الطلبات عند التشغيل');",
    `const pay=document.querySelector('input[name=pay]:checked')?.value==='bank'?'تحويل بنكي':'التواصل مع الإدارة';const msg='طلب اشتراك\\nالمدة: '+document.getElementById('durationSummary').textContent+'\\nالاسم: '+name+'\\nالجوال: '+phone+'\\nالحساب: '+account+'\\nالدفع: '+pay;window.open('https://wa.me/${wa}?text='+encodeURIComponent(msg),'_blank');toast('تم فتح واتساب لإرسال طلبك');`);
  return h;
}

async function shrink(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const s = Math.min(1, 1200 / Math.max(img.width, img.height));
    const cv = document.createElement("canvas"); cv.width = img.width * s; cv.height = img.height * s;
    cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.8);
  } finally { URL.revokeObjectURL(url); }
}

function VoiceStore() {
  const [cfg, setCfg] = useState<Cfg>(defaults);
  const [saved, setSaved] = useState<Cfg>(defaults);
  const [admin, setAdmin] = useState(false);
  const [edit, setEdit] = useState(false);
  useEffect(() => {
    void supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle().then(({ data }) => {
      if (data?.value) { const v = { ...defaults, ...(data.value as Partial<Cfg>) }; setCfg(v); setSaved(v); }
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }).then(({ data: ok }) => setAdmin(!!ok));
    });
  }, []);
  const html = useMemo(() => build(cfg), [cfg]);
  const save = async () => {
    const { error } = await supabase.from("site_settings").upsert({ key: KEY, value: cfg, updated_at: new Date().toISOString() });
    if (error) return toast.error("ما انحفظ: " + error.message);
    setSaved(cfg); toast.success("انحفظ المتجر");
  };
  const f = (k: keyof Cfg, label: string, long = false) => <label className="vs-field"><span>{label}</span>
    {long ? <textarea rows={2} maxLength={400} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
      : <input maxLength={80} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />}</label>;

  return <div className="vs-root" dir="rtl">
    {admin && <div className="vs-bar">
      <Link to="/" className="vs-btn"><Globe />الموقع</Link>
      {!edit ? <button className="vs-btn" onClick={() => setEdit(true)}><Pencil />تعديل المتجر</button> : <>
        <button className="vs-btn vs-save" onClick={save}><Save />حفظ</button>
        <button className="vs-btn" onClick={() => setCfg(saved)}><RotateCcw />تراجع</button>
        <button className="vs-btn" onClick={() => setEdit(false)}><X />إغلاق</button>
      </>}
    </div>}
    {admin && edit && <div className="vs-panel">
      {f("title", "اسم المتجر")}{f("hero", "النص الرئيسي", true)}
      {f("p1", "سعر شهر")}{f("p2", "سعر شهرين")}{f("p3", "سعر 3 أشهر")}
      {f("support", "نص الدعم")}{f("whatsapp", "واتساب الطلبات")}
      <label className="vs-field"><span><ImageIcon className="inline size-4" /> صورة المتجر</span>
        <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setCfg({ ...cfg, image: await shrink(file) }); }} /></label>
    </div>}
    <iframe title="متجر ALMOGHANI VOICE" srcDoc={html} className="vs-frame" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
  </div>;
}
