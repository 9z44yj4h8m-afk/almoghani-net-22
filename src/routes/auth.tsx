import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/components/member-provider";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import satelliteWorld from "@/assets/satellite-world.jpg";
import satelliteMark from "@/assets/satellite-mark.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "دخول الأعضاء — ALMOGHANI LIVE" }, { name: "description", content: "حسابك الشخصي للدخول إلى مكتبة ALMOGHANI الخاصة." }, { property: "og:title", content: "دخول الأعضاء — ALMOGHANI LIVE" }, { property: "og:description", content: "دخول الأعضاء وإنشاء حساب شخصي." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, ready } = useMember();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") || window.location.hash.includes("error")) return;
    void supabase.rpc("ensure_member_profile").then(({ error: profileError }) => {
      if (profileError) { setError("تعذّر حفظ بيانات العضو؛ أعد المحاولة."); return; }
      const destination = sessionStorage.getItem("member-destination");
      sessionStorage.removeItem("member-destination");
      if (destination?.startsWith("/vip") && !destination.startsWith("//")) {
        const url = new URL(destination, window.location.origin);
        void navigate({ to: "/vip", search: { kind: url.searchParams.get("kind") ?? undefined, group: url.searchParams.get("group") ?? undefined, q: url.searchParams.get("q") ?? undefined } });
      } else void navigate({ to: "/vip" });
    });
  }, [user?.id, ready, navigate]);
  const inputClass = "h-12 w-full rounded-md border border-input bg-surface px-3 text-foreground outline-none focus:border-primary";
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const result = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin } });
        if (result.error) throw result.error;
        setMessage(result.data.session ? "تم إنشاء الحساب." : "تحقق من بريدك لتأكيد حسابك ثم سجّل الدخول.");
      } else if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setMessage("إذا كان البريد مسجلًا ستصلك رسالة استعادة كلمة المرور.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
      }
    } catch { setError(mode === "login" ? "تعذّر الدخول؛ تحقق من البريد وكلمة المرور وتأكيد حسابك." : "تعذّر إتمام الطلب؛ تحقق من البيانات وحاول مجددًا."); }
    finally { setBusy(false); }
  }
  return <div className="relative min-h-screen bg-background text-foreground" dir="rtl">
    <img src={satelliteWorld} alt="" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover opacity-30" />
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link to="/" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"><ArrowRight className="h-4 w-4" />الرئيسية</Link>
      <img src={satelliteMark} alt="ALMOGHANI" width={1024} height={1024} className="mb-5 h-20 w-20 rounded-lg" />
      <p className="font-display text-sm font-bold text-accent">ALMOGHANI LIVE</p>
      <h1 className="mt-2 text-3xl font-black">{mode === "signup" ? "إنشاء حساب عضو" : mode === "forgot" ? "استعادة كلمة المرور" : "دخول الأعضاء"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && <label className="block space-y-1.5"><span className="text-sm">اسم العضو</span><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} minLength={2} required autoComplete="name" /></label>}
        <label className="block space-y-1.5"><span className="text-sm">البريد الإلكتروني</span><input type="email" dir="ltr" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        {mode !== "forgot" && <label className="block space-y-1.5"><span className="text-sm">كلمة المرور الشخصية</span><input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}
        <Button type="submit" size="lg" disabled={busy} className="w-full"><UserRound className="h-4 w-4" />{busy ? "جارٍ الإرسال…" : mode === "signup" ? "إنشاء الحساب" : mode === "forgot" ? "إرسال رابط الاستعادة" : "دخول"}</Button>
      </form>
      {mode !== "forgot" && <Button variant="outline" size="lg" className="mt-3" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` }); if (result.error) setError("تعذّر الدخول عبر Google."); } catch { setError("تعذّر الدخول عبر Google."); } finally { setBusy(false); } }}>المتابعة باستخدام Google</Button>}
      <div className="mt-4 flex flex-wrap justify-center gap-2"><Button variant="ghost" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); }}>{mode === "signup" ? "لدي حساب" : "إنشاء حساب"}</Button><Button variant="ghost" onClick={() => { setMode(mode === "forgot" ? "login" : "forgot"); setError(""); setMessage(""); }}>{mode === "forgot" ? "العودة للدخول" : "نسيت كلمة المرور"}</Button></div>
    </main>
  </div>;
}