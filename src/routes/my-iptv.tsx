import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LogOut, Search, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { xtreamLogin, type XtreamChannel } from "@/lib/xtream.functions";

export const Route = createFileRoute("/my-iptv")({
  head: () => ({
    meta: [
      { title: "اشتراكي المباشر | ALMOGHANI LIVE" },
      { name: "description", content: "سجّل باسم المستخدم وكلمة المرور لاشتراكك وشاهد قنواتك مباشرة دون ملف M3U." },
      { property: "og:title", content: "اشتراكي المباشر | ALMOGHANI LIVE" },
      { property: "og:description", content: "شاهد قنوات اشتراكك مباشرة باسم المستخدم وكلمة المرور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyIptv,
});

const STORE = "almoghani-my-iptv";

function Player({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    setErr(false);
    let hls: { destroy: () => void } | undefined;
    let dead = false;
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
      void v.play().catch(() => {});
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (dead) return;
        const h = new Hls();
        hls = h;
        h.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) setErr(true); });
        h.loadSource(src);
        h.attachMedia(v);
        void v.play().catch(() => {});
      });
    }
    return () => { dead = true; hls?.destroy(); v.removeAttribute("src"); v.load(); };
  }, [src]);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <video ref={ref} controls playsInline autoPlay className="aspect-video w-full bg-background" onError={() => setErr(true)} onPlaying={() => setErr(false)} />
      {err && <p role="alert" className="p-2 text-sm text-destructive">تعذّر تشغيل هذه القناة، جرّب قناة أخرى.</p>}
    </div>
  );
}

function MyIptv() {
  const [form, setForm] = useState({ host: "", username: "", password: "" });
  const [channels, setChannels] = useState<XtreamChannel[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [current, setCurrent] = useState<XtreamChannel | null>(null);

  const login = async (creds = form) => {
    setBusy(true); setError("");
    try {
      const res = await xtreamLogin({ data: creds });
      if (!res.ok) { setError(res.error); return; }
      localStorage.setItem(STORE, JSON.stringify(creds));
      setChannels(res.channels);
      setGroup("");
    } catch { setError("حدث خطأ، حاول مرة أخرى"); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (saved?.host) { setForm(saved); void login(saved); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => [...new Set((channels ?? []).map((c) => c.group))], [channels]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (channels ?? []).filter((c) => (!group || c.group === group) && (!s || c.name.toLowerCase().includes(s))).slice(0, 300);
  }, [channels, q, group]);

  const logout = () => { localStorage.removeItem(STORE); setChannels(null); setCurrent(null); };

  if (!channels) {
    return (
      <main dir="rtl" className="mx-auto max-w-md p-6">
        <div className="mb-6 flex items-center gap-2"><Tv className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">اشتراكي المباشر</h1></div>
        <form className="space-y-3 rounded-xl border border-border bg-card p-5" onSubmit={(e) => { e.preventDefault(); void login(); }}>
          <label className="block text-sm">رابط السيرفر (Host)
            <Input dir="ltr" required placeholder="http://example.com:80" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
          </label>
          <label className="block text-sm">اسم المستخدم
            <Input dir="ltr" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="block text-sm">كلمة المرور
            <Input dir="ltr" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}</Button>
          <p className="text-xs text-muted-foreground">بياناتك تُحفظ على جهازك فقط.</p>
        </form>
      </main>
    );
  }

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">قنواتي ({channels.length})</h1>
        <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4" />خروج</Button>
      </div>
      {current && <div><Player src={current.src} /><p className="mt-2 font-bold">{current.name}</p></div>}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1"><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pr-9" placeholder="ابحث عن قناة" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label="القسم" className="rounded-md border border-border bg-card px-3 text-sm" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">كل الأقسام</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => { setCurrent(c); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`flex w-full items-center gap-2 rounded-lg border p-2 text-right text-sm ${current?.id === c.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
              {c.logo ? <img src={c.logo} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Tv className="h-6 w-6 shrink-0 text-muted-foreground" />}
              <span className="line-clamp-2">{c.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
