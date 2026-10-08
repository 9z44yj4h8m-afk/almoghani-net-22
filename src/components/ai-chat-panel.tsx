import { useChat } from "@ai-sdk/react";
import { Link } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowRight, RotateCcw, Bell, BellOff, CheckCheck } from "lucide-react";
import { useEffect, useState, useRef } from "react";

import aiAssistantIcon from "@/assets/ai-assistant-icon.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "almoghani-chat-v1";

export const PERSONAS = [
  { id: "default", label: "المساعد" },
  { id: "bedouin", label: "سوالف بدوية" },
  { id: "sports", label: "رياضة" },
  { id: "movies", label: "أفلام ومسلسلات" },
] as const;

const SUGGESTIONS = ["ما فضل أذكار الصباح؟", "لخّص لي سورة الكهف", "اقترح لي قناة إخبارية أتابعها"];

export function AiChatPanel({ embedded = false }: { embedded?: boolean }) {
  const [notifications, setNotifications] = useState(false);
  const [replyNotice, setReplyNotice] = useState(false);
  const [notificationNote, setNotificationNote] = useState("");
  const notificationEnabled = useRef(false);
  async function toggleNotifications() {
    if (notifications) { notificationEnabled.current = false; setNotifications(false); return; }
    if (!("Notification" in window)) { setNotificationNote("إشعارات المتصفح غير متاحة هنا؛ سيظهر تنبيه داخل الشاشة عند الرد."); return; }
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    notificationEnabled.current = enabled; setNotifications(enabled);
    setNotificationNote(enabled ? "تم تفعيل إشعارات الرد أثناء فتح الموقع." : "لم تُفعّل إشعارات المتصفح؛ يبقى تنبيه الرد داخل الشاشة.");
  }
  const [persona, setPersona] = useState<string>("default");
  const personaRef = useRef("default");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat", body: () => ({ persona: personaRef.current }) }),
    onFinish: () => {
      setReplyNotice(true);
      if (notificationEnabled.current && "Notification" in window && Notification.permission === "granted" && document.visibilityState === "hidden") {
        try { new Notification("ALMOGHANI AI", { body: "اكتمل الرد على رسالتك", tag: "almoghani-ai-reply" }); } catch { /* in-page notice remains available */ }
      }
    },
    onError: (e) => setError(e.message || "تعذّر الاتصال، تحقق من الإنترنت وحاول مرة أخرى."),
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as UIMessage[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [setMessages]);

  useEffect(() => {
    if (ready && status !== "streaming" && status !== "submitted") {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* storage may be unavailable */ }
    }
  }, [messages, status, ready]);

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    if (!text.trim() || busy) return;
    setError("");
    setReplyNotice(false);
    sendMessage({ text: text.trim() });
  }

  function handleSubmit(message: PromptInputMessage) {
    send(message.text);
  }

  return (
    <div dir="rtl" className={embedded ? "member-ai-screen flex flex-col text-foreground" : "flex h-dvh flex-col bg-background text-foreground"}>
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <img src={aiAssistantIcon} alt="" width={1024} height={1024} className="h-10 w-10 rounded-full border border-primary object-cover" />
            <div>
              <h2 className="font-display text-base font-black">ALMOGHANI AI</h2>
              <p className="text-xs text-muted-foreground">مساعدك الذكي</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={toggleNotifications} aria-label={notifications ? "إيقاف إشعارات الرد" : "تفعيل إشعارات الرد"} title={notifications ? "إيقاف إشعارات الرد" : "تفعيل إشعارات الرد"} aria-pressed={notifications}>{notifications ? <Bell /> : <BellOff />}</Button>
            {messages.length > 0 && (
              <Button variant="outline" size="icon" aria-label="محادثة جديدة" title="محادثة جديدة"
                type="button"
                onClick={() => { stop(); setMessages([]); localStorage.removeItem(STORAGE_KEY); setError(""); }}
                className="flex items-center gap-1.5 rounded-md border border-primary/60 px-3 py-1.5 text-sm font-bold hover:border-sky"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {!embedded && <Link to="/" className="icon-button" aria-label="الرئيسية"><ArrowRight className="h-5 w-5" /></Link>}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2 px-4 py-2" role="group" aria-label="اختر شخصية البوت">
        {PERSONAS.map((p) => (
          <Button key={p.id} type="button" size="sm" variant={persona === p.id ? "default" : "outline"} aria-pressed={persona === p.id} onClick={() => { personaRef.current = p.id; setPersona(p.id); }}>{p.label}</Button>
        ))}
      </div>
      {notificationNote && <p role="status" className="border-b border-sky/40 px-4 py-2 text-xs text-muted-foreground">{notificationNote}</p>}
      {replyNotice && <div role="status" className="flex items-center gap-2 border-b border-sky/40 bg-secondary px-4 py-2 text-sm text-sky"><CheckCheck className="h-4 w-4" />وصل رد ALMOGHANI AI<Button size="icon-sm" variant="ghost" className="mr-auto" aria-label="إخفاء تنبيه الرد" onClick={() => setReplyNotice(false)}>×</Button></div>}
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <img src={aiAssistantIcon} alt="" width={1024} height={1024} className="h-20 w-20 rounded-3xl object-cover" />
              <h2 className="text-xl font-black">أهلًا بك، كيف أقدر أساعدك؟</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} type="button" variant="outline" onClick={() => send(s)} className="h-auto whitespace-normal px-4 py-2 text-sm font-bold">{s}</Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground"}>
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      m.role === "assistant" ? (
                        <MessageResponse
                          key={i}
                          components={{
                            a: (props: { href?: string | undefined; children?: React.ReactNode }) => {
                              const href = props.href;
                              const children = props.children;
                              return href?.startsWith("/") && !href.startsWith("//") ? (
                                <a href={href} className="font-bold text-sky underline underline-offset-4 hover:text-primary">{children}</a>
                              ) : (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky underline">{children}</a>
                              );
                            },
                          } as never}
                        >
                          {part.text}
                        </MessageResponse>
                      ) : <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer className="text-sm">يفكّر الآن…</Shimmer>}
          {error && <p role="alert" className="text-sm font-bold text-signal">{error}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptInput onSubmit={handleSubmit} className="portal-frame">
          <PromptInputTextarea placeholder="اكتب رسالتك هنا…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
