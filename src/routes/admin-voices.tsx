import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/components/member-provider";
import { AdminPasswordLogin } from "@/components/admin/password-login";
import { SayNowForm } from "@/components/admin/voice-chat-manager";

export const Route = createFileRoute("/admin-voices")({
  ssr: false,
  head: () => ({ meta: [
    { title: "لوحة الأصوات — المغني لايف" },
    { name: "description", content: "لوحة المالك لتجربة أصوات البوتات النسائية وحفظها في المغني لايف." },
    { property: "og:title", content: "لوحة الأصوات — المغني لايف" },
    { property: "og:description", content: "تخصيص أصوات البوتات وتجريب الصوت وحفظ اختيار البوت." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
    { name: "apple-mobile-web-app-title", content: "الأصوات" },
  ],
  }),
  component: AdminVoicesPage,
});

function AdminVoicesPage() {
  const { user, ready } = useMember();
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    setAdmin(null);
    if (user) void supabase.rpc("claim_owner_admin").then(({ data }) => { if (alive) setAdmin(!!data); });
    return () => { alive = false; };
  }, [user]);
  if (!ready) return null;
  if (!user || admin === false) return <AdminPasswordLogin />;
  if (admin === null) return <div dir="rtl" className="grid min-h-screen place-items-center">جارٍ التحقق…</div>;
  return <div dir="rtl" className="voice-studio-page">
    <main className="voice-studio-main">
      <SayNowForm />
    </main>
  </div>;
}
