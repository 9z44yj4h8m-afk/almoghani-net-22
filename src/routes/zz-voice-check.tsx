import { createFileRoute } from "@tanstack/react-router";
import { SayNowForm } from "@/components/admin/voice-chat-manager";

export const Route = createFileRoute("/zz-voice-check")({
  ssr: false,
  head: () => ({ meta: [{ title: "فحص", name: "robots", content: "noindex" }] }),
  component: Check,
});

function Check() {
  return <div dir="rtl" className="voice-studio-page voice-studio-full">
    <main className="voice-studio-main">
      <SayNowForm locked={false} />
    </main>
  </div>;
}
