import { useState } from "react";
import { Film, Clapperboard, Tv, Search, RefreshCw, User, MoreHorizontal, Trophy, Newspaper, MoonStar, MessageCircle, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BroadcastWordmark } from "@/components/broadcast-shell";
import { useCatalog, useSiteConfig, applyMovieConfig } from "@/lib/site-config";
import { movies } from "@/lib/movies";
import { bedouinSeries } from "@/lib/bedouin-series";
import m0 from "@/assets/iptv-movies/gGaozLyl-y4.jpg.asset.json";
import m1 from "@/assets/iptv-movies/1obs9eMxNAI.jpg.asset.json";
import m2 from "@/assets/iptv-movies/omnLea1B3jc.jpg.asset.json";
import m3 from "@/assets/iptv-movies/gr8ExWtFglY.jpg.asset.json";
import m4 from "@/assets/iptv-movies/1LZvuOn9zEQ.jpg.asset.json";
import m5 from "@/assets/iptv-movies/CUFlewlkV54.jpg.asset.json";
import m6 from "@/assets/iptv-movies/ELOQ0O2kKGU.jpg.asset.json";
import m7 from "@/assets/iptv-movies/y_6zrQZRJr8.jpg.asset.json";
const art = [m0,m1,m2,m3,m4,m5,m6,m7];
const shortcuts = [{ href:"/channels/sports", title:"الرياضة", Icon:Trophy },{ href:"/channels/news", title:"الأخبار", Icon:Newspaper },{ href:"/channels/islamic", title:"القنوات الإسلامية", Icon:MoonStar },{ href:"/chat", title:"الدردشة", Icon:MessageCircle }];
export function GoldHome({ application = false }: { application?: boolean }) {
 const [q,setQ]=useState(""); const [menu,setMenu]=useState(false); const channels=useCatalog(); const {data:config}=useSiteConfig();
 const featured=["mbc-1","sbc-tv","saudi-tv","aljazeera","ar-rotana-cinema","alarabiya"].flatMap(id=>{const c=channels.find(c=>c.id===id);return c?[c]:[];});
 const films=applyMovieConfig(movies,config).slice(0,8);
 return <div className="media-home" dir="rtl">
  <header className="media-topbar">
   <a href="/" className="media-wordmark" aria-label="ALMOGHANI LIVE"><BroadcastWordmark /></a>
   <Tv className="media-topmark" aria-hidden="true" />
   <div className="media-tools">
    <Button variant="secondary" size="icon" title="بحث" aria-label="فتح البحث" onClick={()=>document.getElementById("media-search")?.focus()}><Search /></Button>
    <Button variant="secondary" size="icon" title="تحديث" aria-label="تحديث" onClick={()=>window.location.reload()}><RefreshCw /></Button>
    <Button variant="secondary" size="icon" title="المزيد" aria-label="المزيد" aria-expanded={menu} onClick={()=>setMenu(!menu)}><MoreHorizontal /></Button>
   </div>
  </header>
  {menu&&<nav className="media-menu" aria-label="المزيد"><Button asChild variant="ghost"><a href="/auth"><User />دخول الأعضاء</a></Button><Button asChild variant="ghost"><a href="/my-account"><Settings />الإعدادات</a></Button><Button asChild variant="ghost"><a href={application?"/":"/tv"}><Globe />{application?"الموقع":"التطبيق"}</a></Button><Button asChild variant="ghost"><a href="/contact">التواصل</a></Button><Button asChild variant="ghost"><a href="/admin">لوحة التحكم</a></Button></nav>}
  <form className="media-search" onSubmit={e=>{e.preventDefault();window.location.href=`/live?q=${encodeURIComponent(q.trim())}`;}}><Search /><input id="media-search" aria-label="ابحث عن قناة" placeholder="البحث في القنوات" value={q} onChange={e=>setQ(e.target.value)} /><Button type="submit" variant="ghost" size="icon" aria-label="بحث"><Search /></Button></form>
  <main className="media-home-rows">
   <section className="media-home-row" aria-label="البث المباشر"><Button asChild variant="secondary" className="media-category"><a href="/live"><Tv /><span>بث مباشر</span></a></Button><div className="media-shelf media-channel-shelf">{featured.map(c=><Button asChild key={c.id} variant="ghost" className="media-channel-tile"><a href={`/live?channel=${encodeURIComponent(c.id)}`} aria-label={`شغّل ${c.name}`}><img src={c.thumbnail} alt={c.name} width={200} height={200} /><span>{c.name}</span></a></Button>)}</div></section>
   <section className="media-home-row" aria-label="الأفلام"><Button asChild variant="secondary" className="media-category"><a href="/movies"><Film /><span>أفلام</span></a></Button><div className="media-shelf media-poster-shelf">{films.map(m=>{const i=movies.findIndex(f=>f.id===m.id);return <Button asChild key={m.id} variant="ghost" className="media-poster"><a href="/movies" aria-label={m.title}><img src={art[i]?.url??m0.url} alt="" width={480} height={360} loading="lazy" /><span>{m.title}</span></a></Button>;})}</div></section>
   <section className="media-home-row" aria-label="المسلسلات"><Button asChild variant="secondary" className="media-category"><a href="/bedouin-drama"><Clapperboard /><span>مسلسلات</span></a></Button><div className="media-shelf media-poster-shelf">{bedouinSeries.slice(0,8).map(s=><Button asChild key={s.id} variant="ghost" className="media-poster media-series-poster"><a href="/bedouin-drama" aria-label={`عرض حلقات ${s.title}`}><img src={s.coverImage??s.episodes[0]?.image} alt="" width={480} height={360} loading="lazy" /><span>{s.title}</span></a></Button>)}</div></section>
  </main>
  <nav className="media-shortcuts" aria-label="بقية الأقسام">{shortcuts.map(({href,title,Icon})=><Button asChild key={href} variant="ghost"><a href={href}><Icon />{title}</a></Button>)}</nav>
 </div>;
}
