import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, MessagesSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "./member-provider";
import { botReply } from "@/lib/chat-bots.functions";

const BOT_LINES = ["هلا والله بالجميع 👋 وش تتابعون الحين؟", "مين يتابع الرياضة اليوم؟ ⚽", "أحد شاف مسلسل بدوي حلو؟ اقترحوا لنا 🐎", "لا تنسون تجربون شات ALMOGHANI AI 🤖", "وش أحلى قناة عندكم في الموقع؟"];

type Msg = { id: string; user_id: string | null; display_name: string; body: string; created_at: string };
const EMOJIS = ["👏", "🔥", "💙", "✨"] as const;

function ago(d: string) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `قبل ${Math.floor(s / 60)}د`;
  if (s < 86400) return `قبل ${Math.floor(s / 3600)}س`;
  return `قبل ${Math.floor(s / 86400)}ي`;
}

export function LiveChat() {
  const { user } = useMember();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [guestName, setGuestName] = useState("");
  const [myIds, setMyIds] = useState<string[]>([]);
  const [botLine, setBotLine] = useState(BOT_LINES[0]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % BOT_LINES.length; setBotLine(BOT_LINES[i]); }, 90000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    setGuestName(localStorage.getItem("chat-name") ?? "");
    try { setMyIds(JSON.parse(localStorage.getItem("chat-mine") ?? "[]")); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void supabase.from("chat_messages").select("id,user_id,display_name,body,created_at").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setMsgs((data ?? []).reverse()));
    void supabase.from("chat_reactions").select("emoji,count").then(({ data }) => setReactions(Object.fromEntries((data ?? []).map((r) => [r.emoji, Number(r.count)]))));
    const ch = supabase.channel("live-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => setMsgs((m) => m.some((x) => x.id === (p.new as Msg).id) ? m : [...m.slice(-99), p.new as Msg]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (p) => setMsgs((m) => m.filter((x) => x.id !== (p.old as { id: string }).id)))
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, (p) => { const r = p.new as { emoji: string; count: number }; if (r?.emoji) setReactions((x) => ({ ...x, [r.emoji]: Number(r.count) })); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (user) void supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
    else setIsAdmin(false);
  }, [user?.id]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [msgs.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    if (!user) localStorage.setItem("chat-name", guestName.trim().slice(0, 30));
    setSending(true); setError("");
    const { data, error: err } = await supabase.from("chat_messages").insert({ body: body.slice(0, 300), display_name: user ? "" : guestName.trim().slice(0, 30), user_id: user ? user.id : null }).select("id,user_id,display_name,body,created_at").single();
    setSending(false);
    if (err) { setError(err.message.includes("slow") ? "انتظر لحظات قبل الرسالة التالية." : "تعذّر الإرسال."); return; }
    setText("");
    if (data && !user) { const ids = [...myIds, data.id].slice(-50); setMyIds(ids); localStorage.setItem("chat-mine", JSON.stringify(ids)); }
    if (data) setMsgs((m) => m.some((x) => x.id === data.id) ? m : [...m, data]);
    if (Math.random() < 0.6) void botReply({ data: { body: body.slice(0, 300), author: user ? "عضو" : guestName.trim().slice(0, 30) } }).catch(() => {});
  }

  async function react(emoji: string) {
    setReactions((x) => ({ ...x, [emoji]: (x[emoji] ?? 0) + 1 }));
    await supabase.rpc("add_chat_reaction", { p_emoji: emoji });
  }

  return (
    <section dir="rtl" aria-labelledby="live-chat-title" className="mx-auto max-w-3xl px-3 py-8 sm:px-6">
      <div className="rounded-[2rem] border border-border bg-card/70 p-5 shadow-xl backdrop-blur sm:p-6">
        <p className="text-xs font-bold tracking-wide text-muted-foreground">تفاعل الجمهور</p>
        <h2 id="live-chat-title" className="mt-1 flex items-center gap-3 font-display text-3xl font-black">
          الشات
          <span className="flex items-center gap-1 text-sm font-bold text-accent"><span className="h-2 w-2 rounded-full bg-accent" />{msgs.length}</span>
        </h2>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary"><MessagesSquare className="h-5 w-5" /></span>
          <div><p className="font-black">حديث المشاهدين</p><p className="text-xs text-muted-foreground">كل الآراء مرحب بها، كن لطيفًا.</p></div>
        </div>

        <div ref={listRef} className="mt-4 max-h-96 space-y-5 overflow-y-auto py-2" aria-live="polite">
          <div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/20 text-lg">🤖</span><div><p className="flex items-center gap-2"><b>بوت المغني</b></p><p className="mt-1 text-foreground/90">{botLine}</p></div></div>
          {msgs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا توجد رسائل بعد — كن أول من يكتب.</p>}
          {msgs.map((m) => {
            const mine = user ? m.user_id === user.id : myIds.includes(m.id);
            return (
              <div key={m.id} className="flex gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-black ${mine ? "bg-accent text-accent-foreground" : "bg-primary/25 text-foreground"}`}>{(m.display_name || "ع").trim().charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2"><b>{mine ? "أنت" : m.display_name || "عضو"}</b><span className="text-xs text-muted-foreground">{ago(m.created_at)}</span>
                    {((mine && user) || isAdmin) && <button type="button" aria-label="حذف الرسالة" className="ms-auto text-muted-foreground hover:text-destructive" onClick={() => supabase.from("chat_messages").delete().eq("id", m.id).then(() => setMsgs((x) => x.filter((y) => y.id !== m.id)))}><Trash2 className="h-3.5 w-3.5" /></button>}
                  </p>
                  <p className="mt-1 break-words text-foreground/90">{m.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => react(e)} className="flex items-center gap-2 rounded-xl bg-background/60 px-3 py-2 text-sm font-bold text-muted-foreground transition hover:bg-primary/15" aria-label={`تفاعل ${e}`}>
              <span className="text-lg">{e}</span>{reactions[e] ?? 0}
            </button>
          ))}
        </div>

        <form onSubmit={send} className="mt-4 space-y-2">
          {!user && <input value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={30} placeholder="اسمك (اختياري)" aria-label="اسمك" className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" />}
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 p-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="اكتب تعليقًا للجميع…" aria-label="اكتب تعليقًا" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-muted-foreground" />
            <button type="submit" disabled={sending || !text.trim()} aria-label="إرسال" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground disabled:opacity-50"><ArrowUp className="h-5 w-5" /></button>
          </div>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
