import { useState, type ReactNode } from "react";
import { LayoutGrid, Pencil, Search, Star, Tv, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BroadcastHero } from "@/components/broadcast-hero";
import type { Channel, ChannelCategory } from "@/lib/channels";
import { isSmartersChannel, matchesChannelSearch } from "@/lib/unified-channels";

type Section = { slug: string; title: string; category: ChannelCategory; icon: LucideIcon };
export function IptvWorkspace({ channels, sections, selected, active, onWatch, onSelect, favorites, onFavorite, initialSection, onEditChannel, player }: {
  channels: Channel[]; sections: Section[]; selected: Channel; active: boolean;
  onWatch: () => void; onSelect: (channel: Channel) => void;
  favorites: string[]; onFavorite: (id: string) => void; initialSection?: string | undefined;
  onEditChannel?: ((channel: Channel) => void) | undefined;
  player?: ReactNode;
}) {
  const [category, setCategory] = useState(initialSection ?? "all");
  const [query, setQuery] = useState("");
  const selectedSection = sections.find(s => s.slug === category);
  const uniqueChannels = channels.filter((c, index) => channels.findIndex(item => item.id === c.id) === index);
  const visible = uniqueChannels.filter(c => (category === "all" || (category === "favorites" ? favorites.includes(c.id) : c.category === selectedSection?.category)) && matchesChannelSearch(c.name, query));
  return <section className="iptv-workspace" aria-label="البث المباشر">
    <nav className="iptv-categories" aria-label="تصنيفات القنوات">
      {[{ slug: "all", title: "جميع القنوات", icon: LayoutGrid }, { slug: "favorites", title: "المفضلة", icon: Star }, ...sections].map(({ slug, title, icon: Icon }) => <Button key={slug} variant="ghost" className="iptv-category" aria-pressed={category === slug} onClick={() => setCategory(slug)}><Icon /><span>{title}</span></Button>)}
    </nav>
    <div className="iptv-channel-column">
      <label className="iptv-channel-search"><Search aria-hidden="true" /><input aria-label="بحث في قائمة القنوات" placeholder="بحث عن قناة…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="iptv-channel-count"><Tv /> <span>{visible.length} قناة</span></div>
      <div className="iptv-channel-items">
        {visible.map((channel, index) => <div key={channel.id} className={`iptv-channel-item ${selected.id === channel.id ? "iptv-channel-selected" : ""}`}>
          <Button variant="ghost" className="iptv-channel-select" aria-label={`شغّل ${channel.name}`} aria-pressed={selected.id === channel.id} onClick={() => onSelect(channel)}>
            <span className="iptv-channel-number">{String(index + 1).padStart(2, "0")}</span>
            {channel.thumbnail ? <img src={channel.thumbnail} alt="" loading="lazy" width={80} height={80} /> : <Tv />}
            <span>{channel.name}</span>
          </Button>
          <Button size="icon" variant="ghost" className="iptv-favorite" aria-label={`المفضلة: ${channel.name}`} aria-pressed={favorites.includes(channel.id)} title="المفضلة" onClick={() => onFavorite(channel.id)}><Star className={favorites.includes(channel.id) ? "fill-current" : ""} /></Button>
          {onEditChannel && !isSmartersChannel(channel) && <Button size="icon" variant="outline" className="shrink-0" title={`تعديل ${channel.name}`} aria-label={`تعديل ${channel.name}`} onClick={() => onEditChannel(channel)}><Pencil /></Button>}
        </div>)}
        {!visible.length && <p className="iptv-empty">{category === "favorites" ? "لا توجد قنوات في المفضلة بعد." : "لا توجد قنوات مطابقة."}</p>}
      </div>
    </div>
    <div className="iptv-viewing-column"><BroadcastHero channel={selected} active={active} onWatch={onWatch} player={player} /></div>
  </section>;
}