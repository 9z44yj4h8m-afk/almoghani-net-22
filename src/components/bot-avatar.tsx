import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BotAvatar({ path, name, fallback }: { path?: string | undefined; name: string; fallback: string }) {
  const safePath = path && /^avatars\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/.test(path) ? path : "";
  const { data } = useQuery({
    queryKey: ["bot-avatar", safePath], enabled: !!safePath,
    queryFn: async () => { const { data, error } = await supabase.storage.from("bot-avatars").createSignedUrl(safePath, 3600); if (error) throw error; return data.signedUrl; },
    staleTime: 45 * 60_000, refetchInterval: 45 * 60_000, retry: 1,
  });
  return <span className="classic-chat-avatar overflow-hidden">{data ? <img src={data} alt={`صورة ${name}`} width={60} height={60} className="h-full w-full object-cover" /> : fallback}</span>;
}