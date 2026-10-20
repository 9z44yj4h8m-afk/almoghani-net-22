import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMember } from "./member-provider";
import { Button } from "./ui/button";
import { SmartersPlayer } from "./smarters-player";
import { getMemberAccess } from "@/lib/member.functions";
import { resolveUnifiedLiveChannel } from "@/lib/iptv/library.functions";
export function UnifiedMemberPlayer({ channelId }: { channelId: string }) {
  const { user, ready } = useMember();
  const checkAccess = useServerFn(getMemberAccess);
  const resolveChannel = useServerFn(resolveUnifiedLiveChannel);
  const access = useQuery({ queryKey: ["member-access", user?.id], queryFn: () => checkAccess(), enabled: ready && Boolean(user), retry: false, staleTime: 0 });
  const allowed = ready && Boolean(user) && access.data?.unlocked === true && !access.isError;
  const stream = useQuery({ queryKey: ["unified-live-stream", user?.id, channelId], queryFn: () => resolveChannel({ data: { id: channelId } }), enabled: allowed, retry: false, gcTime: 0, staleTime: 0 });
  if (ready && !user) return <div className="grid aspect-video place-content-center gap-4 p-4 text-center"><p>دخول الأعضاء لمشاهدة هذه القناة</p><Button asChild variant="broadcast"><Link to="/auth" onClick={() => sessionStorage.setItem("member-destination", `${window.location.pathname}?channel=${encodeURIComponent(channelId)}`)}>تسجيل الدخول</Link></Button></div>;
  if (access.isError || (access.data && !access.data.unlocked) || stream.isError) return <div className="grid aspect-video place-content-center gap-3 p-4 text-center"><p role="alert" className="text-destructive">تعذّر فتح القناة؛ تأكد من صلاحية حسابك.</p><Button variant="outline" onClick={async () => { const result = await access.refetch(); if (result.data?.unlocked) void stream.refetch(); }}>إعادة المحاولة</Button></div>;
  if (!allowed || !user || !stream.data) return <div role="status" className="grid aspect-video place-items-center text-muted-foreground">جارٍ فتح القناة…</div>;
  return <SmartersPlayer key={`${user.id}:${channelId}`} url={stream.data.url} />;
}