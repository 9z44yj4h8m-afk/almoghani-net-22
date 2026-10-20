import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Film, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMember } from "@/components/member-provider";
import { SmartersPlayer } from "@/components/smarters-player";
import { getMemberAccess } from "@/lib/member.functions";
import { getUnifiedVodCatalog, resolveUnifiedVod } from "@/lib/iptv/library.functions";
import type { VodKind } from "@/lib/iptv/smarters-config";
export type VodTitle = { id: string; title: string };

export function useUnifiedVod(kind: VodKind, q: string, lang?: "عربي" | "عالمي", enabled = true) {
  const fetchCatalog = useServerFn(getUnifiedVodCatalog);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => { setPage(0); }, [q, lang]);
  useEffect(() => {
    const refresh = () => { setRevision(value => value + 1); setPage(0); };
    window.addEventListener("smarters-config-saved", refresh);
    return () => window.removeEventListener("smarters-config-saved", refresh);
  }, []);
  const catalog = useQuery({ queryKey: ["unified-vod", kind, q, lang, page, revision], queryFn: () => fetchCatalog({ data: { kind, q: q.slice(0, 100), lang, page } }), enabled, retry: false });
  return { ...catalog, page, next: () => setPage(value => value + 1), previous: () => setPage(value => Math.max(0, value - 1)) };
}

export function UnifiedVodCard({ item, onSelect }: { item: VodTitle; onSelect: (item: VodTitle) => void }) {
  return <Button variant="ghost" onClick={() => onSelect(item)} aria-label={`شاهد ${item.title}`} className="flex h-full min-h-40 w-full flex-col items-start justify-between gap-4 overflow-hidden whitespace-normal rounded-lg border border-border bg-surface-deep p-4 text-right">
    <Film className="h-10 w-10 text-primary" />
    <span className="line-clamp-3 text-base font-black">{item.title}</span>
    <span className="flex items-center gap-2 text-sm text-primary"><Play className="h-4 w-4" />شاهد الآن</span>
  </Button>;
}

export function VodPagination({ catalog }: { catalog: ReturnType<typeof useUnifiedVod> }) {
  return <div className="mt-4 flex items-center justify-center gap-3">
    {catalog.isError && <Button variant="outline" onClick={() => catalog.refetch()}><RotateCcw />إعادة المحاولة</Button>}
    {catalog.isPending && catalog.fetchStatus !== "idle" && <p role="status">جارٍ تحميل المحتوى…</p>}
    {catalog.page > 0 && <Button variant="outline" onClick={catalog.previous}>السابق</Button>}
    {(catalog.page + 1) * 60 < (catalog.data?.total ?? 0) && <Button variant="outline" onClick={catalog.next}>التالي</Button>}
  </div>;
}

function PrivateVodPlayback({ kind, item }: { kind: VodKind; item: VodTitle }) {
  const { user, ready } = useMember();
  const getAccess = useServerFn(getMemberAccess);
  const resolve = useServerFn(resolveUnifiedVod);
  const [selected, setSelected] = useState(0);
  const access = useQuery({ queryKey: ["member-access", user?.id], queryFn: () => getAccess(), enabled: ready && !!user, retry: false, staleTime: 0 });
  const content = useQuery({ queryKey: ["private-vod", user?.id, kind, item.id], queryFn: () => resolve({ data: { kind, id: item.id } }), enabled: !!user && access.data?.unlocked === true && !access.isError, retry: false, gcTime: 0 });
  if (!ready) return <p>جارٍ التحقق…</p>;
  if (!user) return <Button asChild><Link to="/auth" onClick={() => sessionStorage.setItem("member-destination", window.location.pathname + window.location.search)}>دخول الأعضاء</Link></Button>;
  if (access.isError || content.isError || access.data?.unlocked === false) return <div><p role="alert">تعذّر فتح المحتوى؛ تأكد من صلاحية حسابك.</p><Button variant="outline" onClick={() => access.isError || !access.data?.unlocked ? access.refetch() : content.refetch()}><RotateCcw />إعادة المحاولة</Button></div>;
  const episode = content.data?.items[selected];
  return <div className="min-w-0 space-y-3">{episode ? <SmartersPlayer key={episode.url} url={episode.url} /> : <p role="status">{content.isSuccess ? "لا توجد حلقات متاحة حاليًا." : "جارٍ تحميل المحتوى…"}</p>}
    {kind === "series" && <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">{content.data?.items.map((ep, index) => <Button key={index} variant={selected === index ? "default" : "outline"} onClick={() => setSelected(index)} className="h-auto whitespace-normal text-right">{ep.name}</Button>)}</div>}
  </div>;
}

export function UnifiedVodDialog({ kind, item, onClose }: { kind: VodKind; item: VodTitle | null; onClose: () => void }) {
  return <Dialog open={!!item} onOpenChange={open => { if (!open) onClose(); }}><DialogContent dir="rtl" className="max-h-[90dvh] max-w-4xl overflow-y-auto"><DialogTitle className="pr-6">{item?.title}</DialogTitle><DialogDescription className="sr-only">مشاهدة {item?.title}</DialogDescription>{item && <PrivateVodPlayback key={item.id} kind={kind} item={item} />}</DialogContent></Dialog>;
}