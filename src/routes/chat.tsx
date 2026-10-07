import { createFileRoute } from "@tanstack/react-router";
import { AiChatPanel } from "@/components/ai-chat-panel";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "ALMOGHANI AI — مساعد ذكي" },
      { name: "description", content: "تحدث كتابيًا مع ALMOGHANI AI واسأله عن أي شيء." },
      { property: "og:title", content: "ALMOGHANI AI — مساعد ذكي" },
      { property: "og:description", content: "شات ذكاء اصطناعي باللغة العربية داخل موقع المغني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() { return <AiChatPanel />; }
