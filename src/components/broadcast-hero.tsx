import { CalendarDays, Heart, Maximize, Play, Share2, Volume2 } from "lucide-react";
import worldImage from "@/assets/news-world.jpg";
import { Button } from "@/components/ui/button";
import { LivePlayer } from "@/components/live-player";
import type { Channel } from "@/lib/channels";

export function BroadcastHero({ channel, active, onWatch, sectionTitle }: {
  channel: Channel; active: boolean; onWatch: () => void; sectionTitle?: string;
}) {
  return <section id="player" className="broadcast-hero scroll-mt-24" dir="rtl">
    <div className="broadcast-screen">
      {active ? <LivePlayer key={channel.id} channel={channel} /> : <div className="relative aspect-[2.45/1] overflow-hidden">
        <img src={worldImage} alt="خريطة العالم المضيئة بالأزرق" width={1536} height={1024} fetchPriority="high" className="h-full w-full object-cover" />
        <span className="reference-live"><span className="animate-live-pulse" />مباشر الآن</span>
        <Button variant="ghost" size="icon" onClick={onWatch} aria-label={`شغّل ${channel.name}`} className="world-play"><Play className="fill-current" /></Button>
        <div className="world-controls"><Button variant="ghost" size="icon" onClick={onWatch} aria-label="تشغيل البث"><Play className="fill-current" /></Button><span className="world-control-line" /><Button variant="ghost" size="icon" onClick={onWatch} aria-label="تشغيل البث مع الصوت"><Volume2 /></Button><Button variant="ghost" size="icon" onClick={onWatch} aria-label="فتح المشغل"><Maximize /></Button></div>
      </div>}
    </div>
    <div className="broadcast-program">
      <span className="on-air">{active ? channel.name : "الآن على الهواء"}</span>
      <div className="broadcast-program-copy"><div><h1>{sectionTitle ?? "تقنية تصنع المستقبل"}</h1><p>{active ? channel.description : "قنوات وبرامج متنوعة في مكان واحد"}</p></div><p className="broadcast-program-aside">كل ما تحب مشاهدته من قنوات وبرامج، يجتمع لك في مكان واحد</p></div>
      <div className="broadcast-program-actions"><CalendarDays /><span /><Heart /><span /><Share2 /><Button variant="broadcast" onClick={onWatch}>{active ? "تابع البث" : "شاهد الآن"}<Play className="fill-current" /></Button></div>
    </div>
  </section>;
}
