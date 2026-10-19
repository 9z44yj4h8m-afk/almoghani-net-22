import { CalendarDays, Play } from "lucide-react";
import { broadcastArt } from "@/lib/broadcast-art";
import { Button } from "@/components/ui/button";
import { LivePlayer } from "@/components/live-player";
import type { Channel } from "@/lib/channels";
import { ChannelSchedule } from "@/components/channel-schedule";

export function BroadcastHero({ channel, active, onWatch, sectionTitle, section }: {
  channel: Channel; active: boolean; onWatch: () => void; sectionTitle?: string | undefined; section?: string | undefined;
}) {
  const art = broadcastArt[section ?? "news"] ?? broadcastArt["general"];
  return <section id="player" className="broadcast-hero iptv-player-hero scroll-mt-24" dir="rtl">
    <div id="broadcast-live-screen" className="iptv-player-screen">
      {active ? <LivePlayer key={channel.id} channel={channel} /> : <div className="iptv-player-preview"><img src={channel.thumbnail || art} alt={channel.name} width={960} height={540} fetchPriority="high" /><Button variant="broadcast" size="icon" onClick={onWatch} aria-label="شاهد الآن" title="شاهد الآن"><Play className="fill-current" /></Button></div>}
    </div>
    <div className="iptv-now-playing"><h1>{channel.name}</h1><span className="live-badge">مباشر</span></div>
    <section className="iptv-program-guide" aria-label="دليل البرامج"><h2><CalendarDays />دليل البرامج</h2><ChannelSchedule channelId={channel.id} /></section>
  </section>;
}
