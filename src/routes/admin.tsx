import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/components/member-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleManager } from "@/components/admin/schedule-manager";
import { channels as baseChannels } from "@/lib/channels";
import { movies as baseMovies } from "@/lib/movies";
import { listMembers, checkStreamUrl } from "@/lib/admin.functions";
import {
  useSiteConfig, siteConfigKey, channelCategories, youtubeIdFrom,
  defaultTexts, defaultContacts, defaultDesign, type SiteTexts, type SiteContacts, type SiteDesign,
} from "@/lib/site-config";

const TABS = ["channels", "movies", "members", "texts", "design", "schedule"] as const;

export const Route = createFileRoute("/admin")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { tab?: string } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined }),
  head: () => ({ meta: [
    { title: "لوحة التحكم — ALMOGHANI" },
    { name: "description", content: "لوحة تحكم مالك موقع ALMOGHANI LIVE." },
    { property: "og:title", content: "لوحة التحكم — ALMOGHANI" },
    { property: "og:description", content: "إدارة القنوات والأفلام والأعضاء والتصميم." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminPage,
});

const input = "h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground outline-none focus:border-primary";

function AdminPage() {
  const { user, ready } = useMember();
  const { tab } = Route.useSearch();
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => { if (user) void supabase.rpc("claim_owner_admin").then(({ data }) => setAdmin(!!data)); }, [user]);

  if (!ready) return null;
  if (!user) return <Center>سجّل الدخول بحساب المالك أولًا. <Link to="/auth" className="text-primary">دخول</Link></Center>;
  if (admin === null) return <Center>جارٍ التحقق…</Center>;
  if (!admin) return <Center>هذه الصفحة لمالك الموقع فقط.</Center>;

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-4 sm:px-6"><Link to="/" className="flex items-center gap-2 font-bold"><ArrowRight className="h-5 w-5" />ALMOGHANI LIVE</Link></header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-black">لوحة التحكم</h1>
        <Tabs defaultValue={TABS.includes(tab as never) ? tab : "channels"} dir="rtl" className="mt-6">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="channels">القنوات</TabsTrigger>
            <TabsTrigger value="movies">الأفلام</TabsTrigger>
            <TabsTrigger value="members">الأعضاء</TabsTrigger>
            <TabsTrigger value="texts">النصوص والتواصل</TabsTrigger>
            <TabsTrigger value="design">التصميم</TabsTrigger>
            <TabsTrigger value="schedule">مواعيد البث</TabsTrigger>
          </TabsList>
          <TabsContent value="channels" className="mt-6"><ChannelsTab /></TabsContent>
          <TabsContent value="movies" className="mt-6"><MoviesTab /></TabsContent>
          <TabsContent value="members" className="mt-6"><MembersTab /></TabsContent>
          <TabsContent value="texts" className="mt-6"><TextsTab /></TabsContent>
          <TabsContent value="design" className="mt-6"><DesignTab /></TabsContent>
          <TabsContent value="schedule" className="mt-6"><ScheduleManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: siteConfigKey });
}

function ChannelsTab() {
  const { data } = useSiteConfig();
  const refresh = useRefresh();
  const check = useServerFn(checkStreamUrl);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", category: "عامة", url: "", logo: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const overrides = new Map((data?.overrides ?? []).map((o) => [o.channel_id, o]));
  const all = useMemo(() => [
    ...(data?.customChannels ?? []).map((c) => ({ id: c.id, name: c.name, category: c.category, custom: true })),
    ...baseChannels.map((c) => ({ id: c.id, name: c.name, category: c.category as string, custom: false })),
  ], [data]);
  const list = all.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 80);

  async function setOverride(id: string, patch: { hidden?: boolean; category?: string | null }) {
    const cur = overrides.get(id);
    await supabase.from("channel_overrides").upsert({ channel_id: id, hidden: patch.hidden ?? cur?.hidden ?? false, category: patch.category !== undefined ? patch.category : cur?.category ?? null, updated_at: new Date().toISOString() });
    void refresh();
  }
  async function setCategory(c: { id: string; custom: boolean }, category: string) {
    if (c.custom) { await supabase.from("custom_channels").update({ category }).eq("id", c.id); void refresh(); }
    else void setOverride(c.id, { category });
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setBusy(true);
    try {
      const r = await check({ data: { url: form.url.trim() } });
      if (!r.ok) { setMsg(r.reason); return; }
      const { error } = await supabase.from("custom_channels").insert({ id: `c-${crypto.randomUUID().slice(0, 8)}`, name: form.name.trim().slice(0, 80), category: form.category, stream_url: form.url.trim(), logo: form.logo.trim().startsWith("https://") ? form.logo.trim() : "" });
      if (error) { setMsg("تعذّر الحفظ."); return; }
      setForm({ ...form, name: "", url: "", logo: "" }); setMsg("أُضيفت القناة ✓"); void refresh();
    } catch { setMsg("الرابط غير صالح."); } finally { setBusy(false); }
  }

  return <div className="space-y-8">
    <form onSubmit={add} className="grid gap-3 rounded-2xl border border-border bg-card/50 p-4">
      <h2 className="font-black">إضافة قناة</h2>
      <input className={input} placeholder="اسم القناة" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{channelCategories.map((c) => <option key={c}>{c}</option>)}</select>
      <input className={input} dir="ltr" placeholder="رابط البث (يوتيوب أو m3u8)" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      <input className={input} dir="ltr" placeholder="رابط الشعار (اختياري)" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
      <Button type="submit" disabled={busy}>{busy ? "جارٍ فحص الرابط…" : "فحص وإضافة"}</Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </form>
    <div>
      <input className={input} placeholder="ابحث عن قناة…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-3 divide-y divide-border">
        {list.map((c) => {
          const o = overrides.get(c.id); const hidden = !!o?.hidden;
          const category = c.custom ? c.category : o?.category ?? c.category;
          return <li key={c.id} className={`flex flex-wrap items-center gap-2 py-3 ${hidden ? "opacity-50" : ""}`}>
            <span className="min-w-0 flex-1 font-bold">{c.name}{c.custom && <span className="ms-2 text-xs text-accent">مضافة</span>}</span>
            <select className="h-9 rounded-lg border border-border bg-card px-2 text-sm" value={category} onChange={(e) => setCategory(c, e.target.value)}>{channelCategories.map((x) => <option key={x}>{x}</option>)}</select>
            <Button size="icon" variant="ghost" aria-label={hidden ? "إظهار" : "إخفاء"} onClick={() => setOverride(c.id, { hidden: !hidden })}>{hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            {c.custom && <Button size="icon" variant="ghost" aria-label="حذف" onClick={async () => { await supabase.from("custom_channels").delete().eq("id", c.id); void refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
          </li>;
        })}
      </ul>
    </div>
  </div>;
}

function MoviesTab() {
  const { data } = useSiteConfig();
  const refresh = useRefresh();
  const check = useServerFn(checkStreamUrl);
  const [form, setForm] = useState({ url: "", title: "", description: "" });
  const [msg, setMsg] = useState("");
  const hidden = new Set(data?.hiddenMovies ?? []);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const id = youtubeIdFrom(form.url.trim());
    if (!id) return setMsg("الصق رابط فيديو يوتيوب صحيح.");
    const r = await check({ data: { url: `https://www.youtube.com/watch?v=${id}` } });
    if (!r.ok) return setMsg(r.reason);
    const { error } = await supabase.from("custom_movies").insert({ youtube_id: id, title: form.title.trim().slice(0, 150), description: form.description.trim().slice(0, 400) });
    if (error) return setMsg("تعذّر الحفظ.");
    setForm({ url: "", title: "", description: "" }); setMsg("أُضيف الفيلم ✓"); void refresh();
  }
  async function toggle(id: string) {
    if (hidden.has(id)) await supabase.from("hidden_movies").delete().eq("movie_id", id);
    else await supabase.from("hidden_movies").insert({ movie_id: id });
    void refresh();
  }
  return <div className="space-y-8">
    <form onSubmit={add} className="grid gap-3 rounded-2xl border border-border bg-card/50 p-4">
      <h2 className="font-black">إضافة فيلم</h2>
      <input className={input} dir="ltr" placeholder="رابط يوتيوب" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      <input className={input} placeholder="عنوان الفيلم" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className={`${input} h-24 py-2`} placeholder="وصف قصير" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Button type="submit">فحص وإضافة</Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </form>
    <ul className="divide-y divide-border">
      {(data?.customMovies ?? []).map((m) => <li key={m.id} className="flex items-center gap-2 py-3"><span className="flex-1 font-bold">{m.title}<span className="ms-2 text-xs text-accent">مضاف</span></span><Button size="icon" variant="ghost" aria-label="حذف" onClick={async () => { await supabase.from("custom_movies").delete().eq("id", m.id); void refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></li>)}
      {baseMovies.map((m) => <li key={m.id} className={`flex items-center gap-2 py-3 ${hidden.has(m.id) ? "opacity-50" : ""}`}><span className="flex-1">{m.title}</span><Button size="icon" variant="ghost" aria-label={hidden.has(m.id) ? "إظهار" : "إخفاء"} onClick={() => toggle(m.id)}>{hidden.has(m.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></li>)}
    </ul>
  </div>;
}

function MembersTab() {
  const fetchMembers = useServerFn(listMembers);
  const members = useQuery({ queryKey: ["admin-members"], queryFn: () => fetchMembers() });
  const [pin, setPin] = useState(""); const [msg, setMsg] = useState("");
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }) : "—";
  return <div className="space-y-8">
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card/50 p-4" onSubmit={async (e) => {
      e.preventDefault(); setMsg("");
      const { error } = await supabase.rpc("admin_set_library_pin", { p_pin: pin });
      setMsg(error ? "تعذّر تغيير الرقم." : "تم تغيير الرقم السري ✓ — كل الجلسات المفتوحة ستطلبه من جديد."); if (!error) setPin("");
    }}>
      <label className="flex-1 space-y-1"><span className="text-sm font-bold">الرقم السري الجديد للمكتبة</span><input className={input} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} /></label>
      <Button type="submit">تغيير</Button>
      {msg && <p className="w-full text-sm text-muted-foreground">{msg}</p>}
    </form>
    {members.isPending ? <p className="text-muted-foreground">جارٍ التحميل…</p> : members.isError ? <p className="text-destructive">تعذّر تحميل الأعضاء.</p> :
      members.data.length === 0 ? <p className="text-muted-foreground">لا يوجد أعضاء بعد.</p> :
      <ul className="divide-y divide-border">{members.data.map((m) => <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3">
        <span className="min-w-0 flex-1"><b>{m.display_name || "عضو"}</b>{m.suspended && <span className="ms-2 text-xs text-destructive">موقوف</span>}<span dir="ltr" className="block text-xs text-muted-foreground">{m.email}</span><span className="block text-xs text-muted-foreground">التسجيل: {fmt(m.created_at)} · آخر دخول: {fmt(m.last_login_at)}</span></span>
        <Button size="sm" variant={m.suspended ? "default" : "outline"} onClick={async () => { await supabase.rpc("admin_set_member_suspended", { p_user: m.user_id, p_suspended: !m.suspended }); void members.refetch(); }}>{m.suspended ? "إعادة التفعيل" : "إيقاف"}</Button>
      </li>)}</ul>}
  </div>;
}

async function saveSetting(key: string, value: object) {
  return supabase.from("site_settings").upsert({ key, value: value as never, updated_at: new Date().toISOString() });
}

function TextsTab() {
  const { data } = useSiteConfig();
  const refresh = useRefresh();
  const [texts, setTexts] = useState<SiteTexts>(defaultTexts);
  const [contacts, setContacts] = useState<SiteContacts>(defaultContacts);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (data) { setTexts(data.texts); setContacts(data.contacts); } }, [data]);
  const field = (label: string, value: string, set: (v: string) => void, ltr = false) => <label className="block space-y-1"><span className="text-sm font-bold">{label}</span><input className={input} dir={ltr ? "ltr" : undefined} value={value} onChange={(e) => set(e.target.value.slice(0, 120))} /></label>;
  return <form className="grid gap-4" onSubmit={async (e) => { e.preventDefault(); const a = await saveSetting("texts", texts); const b = await saveSetting("contacts", contacts); setMsg(a.error || b.error ? "تعذّر الحفظ." : "تم الحفظ ✓"); void refresh(); }}>
    <h2 className="font-black">نصوص الرئيسية</h2>
    {field("عنوان البنر", texts.bannerTitle, (v) => setTexts({ ...texts, bannerTitle: v }), true)}
    {field("السطر تحت العنوان", texts.bannerSubtitle, (v) => setTexts({ ...texts, bannerSubtitle: v }))}
    {field("عبارة المكتبة الخاصة", texts.proLabel, (v) => setTexts({ ...texts, proLabel: v }), true)}
    <h2 className="mt-4 font-black">حسابات التواصل</h2>
    {field("واتساب", contacts.whatsapp, (v) => setContacts({ ...contacts, whatsapp: v }), true)}
    {field("البريد", contacts.email, (v) => setContacts({ ...contacts, email: v }), true)}
    {field("سناب شات (اسم المستخدم)", contacts.snapchat, (v) => setContacts({ ...contacts, snapchat: v }), true)}
    {field("إكس (اسم المستخدم)", contacts.x, (v) => setContacts({ ...contacts, x: v }), true)}
    {field("انستقرام (اسم المستخدم)", contacts.instagram, (v) => setContacts({ ...contacts, instagram: v }), true)}
    <Button type="submit">حفظ</Button>
    {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
  </form>;
}

function DesignTab() {
  const { data } = useSiteConfig();
  const refresh = useRefresh();
  const [design, setDesign] = useState<SiteDesign>(defaultDesign);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (data) setDesign(data.design); }, [data]);
  const save = async (d: SiteDesign) => { const r = await saveSetting("design", d); setMsg(r.error ? "تعذّر الحفظ." : "تم الحفظ ✓"); void refresh(); };
  return <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void save(design); }}>
    <label className="flex items-center gap-3"><input type="color" value={design.primary || "#9333ea"} onChange={(e) => setDesign({ ...design, primary: e.target.value })} className="h-12 w-16 rounded" /><span className="font-bold">اللون الرئيسي</span></label>
    <label className="flex items-center gap-3"><input type="color" value={design.accent || "#22d3ee"} onChange={(e) => setDesign({ ...design, accent: e.target.value })} className="h-12 w-16 rounded" /><span className="font-bold">اللون الثانوي</span></label>
    <label className="block space-y-1"><span className="text-sm font-bold">صورة خلفية البنر (رابط https)</span><input className={input} dir="ltr" placeholder="https://…" value={design.background} onChange={(e) => setDesign({ ...design, background: e.target.value.trim() })} /></label>
    {design.background.startsWith("https://") && <img src={design.background} alt="معاينة الخلفية" className="h-40 w-full rounded-xl object-cover" />}
    <div className="flex gap-2"><Button type="submit">حفظ</Button><Button type="button" variant="outline" onClick={() => { setDesign(defaultDesign); void save(defaultDesign); }}>إرجاع التصميم الأصلي</Button></div>
    {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
  </form>;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div dir="rtl" className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">{children}</div>;
}
