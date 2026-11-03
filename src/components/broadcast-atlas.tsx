import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpDown, ChevronDown, Circle, ListFilter, Menu, Play, Radio, RefreshCw, Search, Tv, Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { LivePlayer } from "./live-player";
import { UnifiedMemberPlayer } from "./unified-member-player";
import { channelCategories, useCatalog } from "@/lib/site-config";
import { getUnifiedLiveCatalog } from "@/lib/iptv/library.functions";
import { isSmartersChannel, mergeLiveChannels, smartersCategory } from "@/lib/unified-channels";
import { appendAtlasChannels, channelKind, filterAtlasChannels, importAtlasPlaylist, type AtlasChannel } from "@/lib/broadcast-atlas";

const stateLabels: Record<string, string> = { loading: "جارٍ الاتصال", playing: "يعمل الآن", paused: "متوقف مؤقتًا", reconnecting: "إعادة الاتصال", failed: "تعذّر التشغيل", idle: "بانتظار اختيار قناة" };
const destinations = [["/live", "البث المباشر"], ["/sections", "الأقسام"], ["/movies", "الأفلام"], ["/bedouin-drama", "المسلسلات"], ["/chat", "الدردشة AI"], ["/auth", "دخول الأعضاء"], ["/vip", "مكتبة الأعضاء"], ["/subscription", "الاشتراك"], ["/100", "الأصوات"], ["/tv", "التطبيق"], ["/my-account", "الإعدادات"], ["/contact", "التواصل"], ["/admin", "لوحة الإدارة"]];
function ChannelLogo({ channel }: { channel?: AtlasChannel | undefined }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [channel?.thumbnail]);
  return <span className="atlas-channel-logo">{channel?.thumbnail && !failed ? <img src={channel.thumbnail} alt="" width={48} height={48} loading="lazy" onError={() => setFailed(true)} /> : <Tv aria-hidden="true" />}</span>;
}
export function BroadcastAtlas() {
  const publicChannels = useCatalog();
  const fetchCatalog = useServerFn(getUnifiedLiveCatalog);
  const catalog = useQuery({ queryKey: ["unified-live-catalog"], queryFn: () => fetchCatalog(), staleTime: Infinity, retry: false, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false });
  const [localChannels, setLocalChannels] = useState<AtlasChannel[]>([]);
  const channels = useMemo(() => {
    const members = (catalog.data ?? []).map(item => ({ id: item.id, name: item.name, category: smartersCategory(item.group), description: item.group, thumbnail: publicChannels.find(channel => channel.name.toLowerCase() === item.name.toLowerCase())?.thumbnail ?? "" }));
    return appendAtlasChannels(mergeLiveChannels(publicChannels, members), localChannels);
  }, [publicChannels, catalog.data, localChannels]);
  const [country, setCountry] = useState("sa");
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("idle");
  const [retry, setRetry] = useState(0);
  const [shown, setShown] = useState(100);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const filtered = filterAtlasChannels(channels, query, country, kind, category);
  const selected = channels.find(channel => channel.id === selectedId);
  const updateState = useCallback((value: string) => setStatus(value), []);
  useEffect(() => { setShown(100); }, [query, country, kind, category]);
  const select = (channel: AtlasChannel, play = true) => { setSelectedId(channel.id); setActive(play); setStatus(play ? "loading" : "idle"); };
  const move = (direction: number, play = true) => {
    if (!filtered.length) return;
    const current = filtered.findIndex(channel => channel.id === selectedId);
    const index = current < 0 ? 0 : (current + direction + filtered.length) % filtered.length;
    const next = filtered[index];
    if (next) { setShown(value => Math.max(value, index + 1)); select(next, play); }
  };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable=true],[role=dialog]"))) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); move(event.key === "ArrowDown" ? 1 : -1, false); }
      if (event.key === "Enter" && !(event.target instanceof HTMLElement && event.target.closest("button,a"))) { event.preventDefault(); const channel = selected ?? filtered[0]; if (channel) select(channel); }
      if (event.key.toLowerCase() === "f" && (!active || (selected && isSmartersChannel(selected)))) {
        event.preventDefault(); if (document.fullscreenElement) void document.exitFullscreen(); else void screenRef.current?.requestFullscreen?.().catch(() => undefined);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  });
  useEffect(() => { listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest" }); }, [selectedId, shown]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("channel");
    if (id) { setSelectedId(id); setActive(true); setCountry("all"); }
  }, []);
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const imported = importAtlasPlaylist(await file.text(), String(Date.now()));
      setLocalChannels(previous => appendAtlasChannels(previous, imported));
      setCountry("all"); setKind("all"); setCategory("all"); setQuery("");
      setNotice(`أُضيفت ${imported.length} قناة من الملف لهذه الجلسة فقط.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "تعذّر قراءة الملف."); }
    if (fileRef.current) fileRef.current.value = "";
  }
  const watch = () => { const channel = selected ?? filtered[0]; if (channel) select(channel); };
  return <main className="broadcast-atlas" dir="rtl">
    <section className="atlas-browser" aria-label="تصفح القنوات">
      <header className="atlas-brand-bar">
        <span className="atlas-brand-mark"><Tv /></span>
        <div className="atlas-brand-copy"><h1 dir="ltr">ALMOGHANI <span>LIVE</span></h1><p>أطلس البث <span>/</span> قنوات السعودية</p></div>
        <Button variant="outline" className="atlas-import" onClick={() => fileRef.current?.click()}><Upload /><span>استيراد M3U</span></Button>
        <Button variant="ghost" size="icon" title="صفحات الموقع" aria-label="صفحات الموقع" aria-expanded={menu} onClick={() => setMenu(value => !value)}>{menu ? <X /> : <Menu />}</Button>
        <input hidden type="file" ref={fileRef} accept=".m3u,.m3u8,audio/x-mpegurl" onChange={event => void importFile(event.target.files?.[0])} />
        {menu && <nav className="atlas-site-menu" aria-label="صفحات الموقع">{destinations.map(([href, label]) => <Button key={href} asChild variant="ghost"><a href={href}>{label}</a></Button>)}</nav>}
      </header>
      <div className="atlas-keyboard"><span><kbd>↑</kbd><kbd>↓</kbd> تنقّل</span><span><kbd>Enter</kbd> مشاهدة</span><span><kbd>F</kbd> ملء الشاشة</span><span className="atlas-keyboard-caption">بث مباشر، في مكان واحد</span></div>
      <div className="atlas-filters">
        <label><Tv /><select aria-label="البلد" value={country} onChange={event => setCountry(event.target.value)}><option value="sa">السعودية</option><option value="all">جميع البلدان</option></select><ChevronDown /></label>
        <label><Radio /><select aria-label="نوع البث" value={kind} onChange={event => setKind(event.target.value)}><option value="all">الكل — تلفزيون وإذاعة</option><option value="tv">تلفزيون</option><option value="radio">إذاعة</option></select><ChevronDown /></label>
        <label><ListFilter /><select aria-label="التصنيفات" value={category} onChange={event => setCategory(event.target.value)}><option value="all">التصنيفات</option>{channelCategories.map(value => <option key={value} value={value}>{value}</option>)}</select><ChevronDown /></label>
      </div>
      <div className="atlas-list-heading"><h2>القنوات <span>{filtered.length.toLocaleString("ar-SA")}</span></h2><ArrowUpDown size={16} /></div>
      <label className="atlas-search"><Search /><input type="search" aria-label="ابحث عن قناة" placeholder="ابحث عن قناتك المفضلة…" value={query} onChange={event => setQuery(event.target.value)} /><span>بحث</span></label>
      {notice && <div className="atlas-notice" role="status">{notice}<Button variant="ghost" size="icon" aria-label="إغلاق التنبيه" onClick={() => setNotice("")}><X /></Button></div>}
      <div className="atlas-channel-list" ref={listRef} onScroll={event => { const element = event.currentTarget; if (element.scrollTop + element.clientHeight >= element.scrollHeight - 200) setShown(value => Math.min(value + 100, filtered.length)); }}>
        {filtered.slice(0, shown).map(channel => <Button variant="ghost" key={channel.id} className="atlas-channel-row" aria-label={`شغّل ${channel.name}`} aria-pressed={selectedId === channel.id} onClick={() => select(channel)}>
          <ChannelLogo channel={channel} /><span className="atlas-row-copy"><strong>{channel.name}</strong><small>{channel.category} <span>·</span> {channelKind(channel) === "radio" ? "إذاعة" : "تلفزيون"}</small></span><span className="atlas-row-state"><Circle />{selectedId === channel.id && active ? stateLabels[status] ?? "قناة أعضاء" : isSmartersChannel(channel) ? "للأعضاء" : "بث مباشر"}</span>
        </Button>)}
        {!filtered.length && <div className="atlas-no-results"><Search /><p>لا توجد قنوات مطابقة</p><Button variant="outline" onClick={() => { setQuery(""); setCountry("all"); setKind("all"); setCategory("all"); }}>عرض جميع القنوات</Button></div>}
      </div>
      <footer className="atlas-list-footer"><span><Circle /> ALMOGHANI NET</span><span>{filtered.length.toLocaleString("ar-SA")} قناة</span></footer>
    </section>
    <section className="atlas-viewer" aria-label="شاشة المشاهدة">
      <header className="atlas-viewer-heading"><span className="atlas-live-label"><Circle /> البث المباشر</span><span>{stateLabels[status] ?? status}</span></header>
      <div className="atlas-viewer-body">
        <div className="atlas-screen" ref={screenRef}>
          {active && selected ? isSmartersChannel(selected) ? <UnifiedMemberPlayer key={`${selected.id}:${retry}`} channelId={selected.id} /> : <LivePlayer key={`${selected.id}:${retry}`} channel={selected} atlas onPrevious={() => move(-1)} onNext={() => move(1)} onState={updateState} /> : <div className="atlas-empty-screen"><Button variant="ghost" className="atlas-start" size="icon" aria-label="بدء المشاهدة" onClick={watch}><Play /></Button><h2>شاشتك على موعد</h2><p>اختر قناة من القائمة لبدء المشاهدة</p><span dir="ltr">ALMOGHANI LIVE</span></div>}
        </div>
        <div className="atlas-now-playing"><ChannelLogo channel={selected} /><div><h2>{selected?.name ?? "لم تُحدد قناة بعد"}</h2><p>{selected?.category ?? "قنواتك المفضلة، أقرب إليك"}</p></div><span className="atlas-quality">{selected ? "تلقائي" : "—"}</span></div>
        <div className="atlas-playback-status"><span><Circle />{stateLabels[status] ?? status}</span><span>{selected ? channelKind(selected) === "radio" ? "RADIO" : "LIVE TV" : "16:9"}</span></div>
        <div className="atlas-watch-actions"><Button className="atlas-watch" onClick={watch} disabled={!filtered.length && !selected}><Play />مشاهدة</Button><Button variant="outline" onClick={() => { if (selected) { setRetry(value => value + 1); setActive(true); setStatus("loading"); } }} disabled={!selected}><RefreshCw />إعادة المحاولة</Button></div>
      </div>
      <footer className="atlas-viewer-footer"><Tv /><span>ALMOGHANI LIVE</span><span>أطلس البث</span></footer>
    </section>
  </main>;
}
