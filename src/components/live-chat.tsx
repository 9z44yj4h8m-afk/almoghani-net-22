import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Smile, Trash2, Volume2, Loader2, Users, MessageCircle, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import contactBanner from "@/assets/chat/contact-banner.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "./member-provider";
import { botReply, botBanter } from "@/lib/chat-bots.functions";
import { useSiteConfig } from "@/lib/site-config";
import { defaultChatAppearance, requestedChatEmojis } from "@/lib/chat-appearance";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatAppearanceStyle } from "@/components/chat-appearance-style";
import { BotAvatar } from "@/components/bot-avatar";
import { withoutArabicDiacritics } from "@/lib/chat-text";

const BOT_LINES = ["هلا والله بالجميع 👋 وش تتابعون الحين؟", "مين يتابع الرياضة اليوم؟ ⚽", "أحد شاف مسلسل بدوي حلو؟ اقترحوا لنا 🐎", "لا تنسون تجربون شات ALMOGHANI AI 🤖", "وش أحلى قناة عندكم في الموقع؟"];

type Msg = { id: string; user_id: string | null; display_name: string; body: string; created_at: string; room_id?: string | null };
type Room = { id: string; name: string };
const EMOJIS = ["👏", "🔥", "💙", "✨"] as const;

function ago(d: string) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `قبل ${Math.floor(s / 60)}د`;
  if (s < 86400) return `قبل ${Math.floor(s / 3600)}س`;
  return `قبل ${Math.floor(s / 86400)}ي`;
}

export function LiveChat({ onIncoming, bare = false, voice = false }: { onIncoming?: (m: { display_name: string; body: string }) => void; bare?: boolean; voice?: boolean } = {}) {
  const navigate = useNavigate();
  const incomingRef = useRef(onIncoming); incomingRef.current = onIncoming;
  const { user } = useMember();
  const { data: siteConfig } = useSiteConfig();
  const appearance = siteConfig?.chatAppearance ?? defaultChatAppearance;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  async function playVoice(id: string) {
    audioRef.current?.pause();
    setVoiceLoading(id);
    try {
      const res = await fetch("/api/public/bot-voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id }) });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audioRef.current = audio;
      await audio.play();
    } catch { setError("تعذّر تشغيل الصوت، حاول لاحقًا."); } finally { setVoiceLoading(null); }
  }
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const voiceOnRef = useRef(false);
  async function drainQueue() {
    if (playingRef.current) return;
    playingRef.current = true;
    while (voiceOnRef.current && queueRef.current.length) {
      const id = queueRef.current.shift()!;
      try {
        const res = await fetch("/api/public/bot-voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id }) });
        if (!res.ok) continue;
        const audio = new Audio(URL.createObjectURL(await res.blob()));
        audioRef.current = audio;
        await new Promise<void>((done) => { audio.onended = () => done(); audio.onerror = () => done(); audio.play().catch(() => done()); });
      } catch { /* skip this line */ }
    }
    playingRef.current = false;
  }
  const isBotName = (raw: string) => { const n = siteConfig?.botNameAliases[raw] ?? raw; return !!(siteConfig?.chatNames.includes(n) || siteConfig?.botNameAliases[raw] || siteConfig?.botAvatars[n]); };
  const isBotRef = useRef(isBotName); isBotRef.current = isBotName;
  const listRef = useRef<HTMLDivElement>(null);
  const [guestName, setGuestName] = useState("");
  const [entered, setEntered] = useState(false);
  voiceOnRef.current = voice && entered;
  useEffect(() => { if (!voice || !entered) { audioRef.current?.pause(); queueRef.current = []; } }, [voice, entered]);
  const [myIds, setMyIds] = useState<string[]>([]);
  const [botLine, setBotLine] = useState(BOT_LINES[0]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [sideTab, setSideTab] = useState<"people" | "room">("people");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [roomError, setRoomError] = useState("");
  const activeRoom = rooms.find((r) => r.id === roomId)?.name ?? "الدردشة العامة";
  const emojis = [...new Set([...requestedChatEmojis, ...appearance.emojis])];
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const displayName = (name: string) => siteConfig?.botNameAliases[name] ?? name;
  const names = [...new Set([...(roomId ? [] : siteConfig?.chatNames ?? []), ...msgs.map((m) => displayName(m.display_name) || "عضو")])].filter((name) => name.includes(peopleQuery));
  useEffect(() => {
    const load = () => { void supabase.from("chat_rooms").select("id,name").order("created_at").then(({ data }) => setRooms(data ?? [])); };
    load(); const timer = setInterval(load, 15000); return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % BOT_LINES.length; setBotLine(BOT_LINES[i]); }, 90000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const run = () => { if (!roomId && document.visibilityState === "visible") void botBanter().catch(() => {}); };
    const first = setTimeout(run, 8000);
    const t = setInterval(run, voice && entered ? 20000 : 60000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [roomId, voice, entered]);
  useEffect(() => {
    setGuestName(localStorage.getItem("chat-name") ?? "");
    try { setMyIds(JSON.parse(localStorage.getItem("chat-mine") ?? "[]")); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let alive = true; setMsgs([]);
    const query = supabase.from("chat_messages").select("id,user_id,display_name,body,created_at,room_id");
    void (roomId ? query.eq("room_id", roomId) : query.is("room_id", null)).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { if (alive) setMsgs((data ?? []).reverse()); });
    void supabase.from("chat_reactions").select("emoji,count").then(({ data }) => setReactions(Object.fromEntries((data ?? []).map((r) => [r.emoji, Number(r.count)]))));
    const ch = supabase.channel(`live-chat-${roomId ?? "general"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => setMsgs((m) => { const n = p.new as Msg; if ((n.room_id ?? null) !== roomId || m.some((x) => x.id === n.id)) return m; incomingRef.current?.(n); if (voiceOnRef.current && isBotRef.current(n.display_name)) { queueRef.current = [...queueRef.current.slice(-4), n.id]; void drainQueue(); } return [...m.slice(-99), n]; }))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (p) => setMsgs((m) => m.filter((x) => x.id !== (p.old as { id: string }).id)))
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, (p) => { const r = p.new as { emoji: string; count: number }; if (r?.emoji) setReactions((x) => ({ ...x, [r.emoji]: Number(r.count) })); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(ch); };
  }, [roomId]);

  useEffect(() => {
    if (user) void supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
    else setIsAdmin(false);
  }, [user?.id]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [msgs.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !entered) return;
    if (!user) localStorage.setItem("chat-name", guestName.trim().slice(0, 30));
    setSending(true); setError("");
    const { data, error: err } = await supabase.from("chat_messages").insert({ body: body.slice(0, 300), display_name: guestName.trim().slice(0, 30), user_id: user ? user.id : null, room_id: roomId }).select("id,user_id,display_name,body,created_at,room_id").single();
    setSending(false);
    if (err) { setError(err.message.includes("slow") ? "انتظر لحظات قبل الرسالة التالية." : "تعذّر الإرسال."); return; }
    setText("");
    if (data && !user) { const ids = [...myIds, data.id].slice(-50); setMyIds(ids); localStorage.setItem("chat-mine", JSON.stringify(ids)); }
    if (data) setMsgs((m) => m.some((x) => x.id === data.id) ? m : [...m, data]);
    void botReply({ data: { body: body.slice(0, 300), author: guestName.trim().slice(0, 30), ...(data ? { messageId: data.id } : {}) } }).catch(() => {});
  }

  async function react(emoji: string) {
    setReactions((x) => ({ ...x, [emoji]: (x[emoji] ?? 0) + 1 }));
    await supabase.rpc("add_chat_reaction", { p_emoji: emoji });
  }
  async function createRoom(e: FormEvent) {
    e.preventDefault(); setCreating(true); setRoomError("");
    const { data, error } = await supabase.rpc("create_chat_room", { p_name: roomName.trim() });
    setCreating(false);
    if (error) { setRoomError(error.code === "23505" ? "اسم الغرفة موجود؛ اختر اسمًا آخر." : error.message.includes("slow") ? "انتظر لحظات قبل إنشاء غرفة أخرى." : "تعذر إنشاء الغرفة؛ حاول مجددًا."); return; }
    const room = Array.isArray(data) ? data[0] : data;
    if (!room) return;
    setRooms((old) => [...old.filter((r) => r.id !== room.id), room]); setRoomId(room.id); setSelectedRoomId(room.id); setCreateOpen(false); setRoomName(""); setSideTab("people");
  }

  return (
    <section dir="rtl" aria-labelledby="live-chat-title" className={`classic-chat ${bare ? "classic-chat-bare" : "classic-chat-page"}`}>
      <ChatAppearanceStyle config={appearance} />
      <div className="classic-chat-frame">
        <div className="classic-chat-masthead" dir="ltr">
          <h2 id="live-chat-title">ALMOGHANI <span>LIVE</span></h2>
        </div>
        {!entered ? <form className="classic-chat-entry" onSubmit={(e) => { e.preventDefault(); const name = guestName.trim().slice(0, 30); if (!name) return; setGuestName(name); localStorage.setItem("chat-name", name); setEntered(true); }}>
          {voice ? <h2 className="text-center text-lg font-bold">الشات الصوتي</h2> : <Button type="submit" className="w-full">الشات الكتابي</Button>}
          <label htmlFor={bare ? "chat-nickname-bare" : "chat-nickname"}>اكتب اسمك المستعار</label>
          <input id={bare ? "chat-nickname-bare" : "chat-nickname"} className="member-screen-input" value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={30} required autoComplete="nickname" />
          {voice ? <Button type="submit" disabled={!guestName.trim()} className="w-full"><Volume2 />دخول الشات الصوتي</Button> : <Button type="button" variant="secondary" disabled={!guestName.trim()} className="w-full" onClick={() => { const name = guestName.trim().slice(0, 30); if (!name) return; localStorage.setItem("chat-name", name); void navigate({ to: "/voice-chat" }); }}><Volume2 />الشات الصوتي</Button>}
          {!bare && <Button asChild variant="outline"><Link to="/" target="_blank" rel="noopener noreferrer"><ExternalLink />الرئيسية</Link></Button>}
        </form> : <>
        <div className="classic-chat-workspace">
        <div ref={listRef} className="classic-chat-messages" aria-live="polite" aria-label="رسائل الدردشة">
          <div className="classic-chat-system sr-only">{botLine}</div>
          {msgs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا توجد رسائل بعد — كن أول من يكتب.</p>}
          {msgs.map((m) => {
            const mine = user ? m.user_id === user.id : myIds.includes(m.id);
            const name = displayName(m.display_name);
            return (
              <div key={m.id} className={`classic-chat-message ${mine ? "classic-chat-mine" : ""}`}>
                <BotAvatar name={name} path={siteConfig?.botAvatars[name]} fallback={appearance.avatarIcon === "default" ? (name || "ع").trim().charAt(0) : appearance.avatarIcon} />
                <div className="min-w-0 flex-1">
                  <p className="classic-chat-message-meta"><b>{name || (mine ? "أنت" : "عضو")}</b><time dateTime={m.created_at}>{ago(m.created_at)}</time>
                    {((mine && user) || isAdmin) && <Button type="button" variant="ghost" size="icon-xs" aria-label="حذف الرسالة" onClick={() => supabase.from("chat_messages").delete().eq("id", m.id).then(() => setMsgs((x) => x.filter((y) => y.id !== m.id)))}><Trash2 /></Button>}
                  </p>
                  {(() => { const isBot = !!(siteConfig?.chatNames.includes(name) || siteConfig?.botNameAliases[m.display_name] || siteConfig?.botAvatars[name]); return <p className="classic-chat-body">{isBot ? withoutArabicDiacritics(m.body) : m.body}{isBot && <Button type="button" variant="ghost" size="icon-xs" aria-label={`استمع لصوت ${name}`} disabled={voiceLoading === m.id} onClick={() => playVoice(m.id)}>{voiceLoading === m.id ? <Loader2 className="animate-spin" /> : <Volume2 />}</Button>}</p>; })()}
                </div>
              </div>
            );
          })}
        </div>
        <aside className="classic-chat-sidebar" aria-label="الأسماء والغرف">
          <div className="classic-chat-tabs" role="tablist" aria-label="قائمة الدردشة">
            <Button role="tab" aria-selected={sideTab === "people"} className="classic-chat-control" variant="secondary" onClick={() => setSideTab("people")}><Users />المستخدمون</Button>
            <Button role="tab" aria-selected={sideTab === "room"} className="classic-chat-control" variant="secondary" onClick={() => setSideTab("room")}><MessageCircle />غرف</Button>
          </div>
          {sideTab === "people" ? <>
            <label className="classic-chat-filter"><span>عرض كل المستخدمين في غرفة ({names.length})</span><input aria-label="بحث عن اسم" value={peopleQuery} onChange={(e) => setPeopleQuery(e.target.value)} /><b>الاسم المستعار</b></label>
            <div className="classic-chat-people">{names.map((name) => <div key={name} className="classic-chat-person"><BotAvatar name={name} path={siteConfig?.botAvatars[name]} fallback={appearance.avatarIcon === "default" ? name.trim().charAt(0) : appearance.avatarIcon} /><Button variant="ghost" className="min-w-0 flex-1 justify-start overflow-hidden px-0 text-inherit" title={`الرد على ${name}`} onClick={() => { setText(`@${name} `); inputRef.current?.focus(); }}><span className="truncate">{name}</span></Button></div>)}{!names.length && <p className="p-3 text-sm">لا توجد أسماء بعد.</p>}</div>
          </> : <div className="classic-chat-room"><MessageCircle /><b>{activeRoom}</b><select aria-label="اختيار الغرفة" className="member-screen-input w-full text-xs" value={selectedRoomId ?? ""} onChange={(e) => setSelectedRoomId(e.target.value || null)}><option value="">الدردشة العامة</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select><Button className="classic-chat-control" variant="secondary" onClick={() => { setRoomId(selectedRoomId); setSideTab("people"); }}>دخول الغرفة</Button><Button className="classic-chat-control" variant="secondary" onClick={() => { setRoomError(""); setCreateOpen(true); }}><Plus />إنشاء غرفة</Button></div>}
        </aside>
        </div>
        <form onSubmit={send} className="classic-chat-compose">
          <p className="sr-only">{guestName}</p>
          <div className="classic-chat-compose-row">
            <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="اكتب رسالتك…" aria-label="اكتب تعليقًا" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
             <Button type="button" variant="secondary" className="classic-chat-smile" aria-label="الرموز التعبيرية" aria-expanded={showEmoji} onClick={() => setShowEmoji((v) => !v)}>{appearance.smileIcon === "default" || appearance.smileIcon === "🙂" ? <Smile aria-hidden="true" /> : <span>{appearance.smileIcon}</span>}</Button>
            <div className="classic-chat-actions"><Button type="button" variant="secondary" className="classic-chat-control classic-chat-pictures" onClick={() => setShowEmoji((v) => !v)} aria-expanded={showEmoji}>الصور</Button><Button asChild className="classic-chat-exit"><Link to="/">خروج</Link></Button><Button type="submit" variant="secondary" className="classic-chat-control classic-chat-send" disabled={sending || !text.trim()} aria-label="إرسال">{appearance.sendIcon !== "default" && <span>{appearance.sendIcon}</span>}{sending ? "جارٍ الإرسال" : "إرسال"}</Button></div>
          </div>
          {showEmoji && <div className="classic-chat-emojis">{emojis.map((emoji) => <Button key={emoji} type="button" variant="ghost" size="icon" aria-label={`إضافة ${emoji}`} onClick={() => { setText((v) => (v + emoji).slice(0, 300)); inputRef.current?.focus(); }}>{emoji}</Button>)}<div className="classic-chat-reactions">{EMOJIS.map((emoji) => <Button key={emoji} type="button" variant="ghost" size="sm" onClick={() => react(emoji)} aria-label={`تفاعل ${emoji}`}>{emoji} {reactions[emoji] ?? 0}</Button>)}</div></div>}
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        </>}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent dir="rtl" className="w-[calc(100%-2rem)] max-w-sm"><DialogTitle>إنشاء غرفة</DialogTitle><form onSubmit={createRoom} className="grid gap-4"><label htmlFor="new-chat-room">اسم الغرفة</label><input id="new-chat-room" className="member-screen-input" minLength={2} maxLength={40} required value={roomName} onChange={(e) => setRoomName(e.target.value)} autoFocus /><Button type="submit" disabled={creating || roomName.trim().length < 2}><Plus />{creating ? "جارٍ الإنشاء…" : "إنشاء"}</Button>{roomError && <p role="alert" className="text-sm text-destructive">{roomError}</p>}</form></DialogContent></Dialog>
        <footer className="classic-chat-footer" dir="ltr"><Link to="/contact" aria-label="للتواصل مع إدارة الموقع"><img src={contactBanner.url} alt="للتواصل مع إدارة الموقع" width={469} height={98} /></Link><span>ALMOGHANI <b>LIVE</b></span></footer>
      </div>
    </section>
  );
}
