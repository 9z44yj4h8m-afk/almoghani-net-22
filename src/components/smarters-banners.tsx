import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { featuredChannels } from "@/lib/featured-channels";
import netflix from "@/assets/smarters-netflix-banner.png.asset.json";
import bein from "@/assets/smarters-bein-banner.png.asset.json";
import ssc from "@/assets/smarters-ssc-banner.jpg";
import shahid from "@/assets/smarters-shahid-banner.jpg";
import alkass from "@/assets/smarters-alkass-banner.jpg";
import abudhabi from "@/assets/smarters-abudhabi-banner.jpg";

const images: Record<string, string> = {
  "bein-sports-1": bein.url,
  "ssc-1": ssc,
  "abu-dhabi-sports": abudhabi,
  alkass,
  netflix: netflix.url,
  shahid,
};

const order = ["bein-sports-1", "netflix", "ssc-1", "shahid", "alkass", "abu-dhabi-sports"];

export function SmartersBanners({ onBrowse }: { onBrowse: (query: string) => void }) {
  return <section aria-label="باقات قنوات سمارتر" className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
    {order.map((id, index) => {
      const channel = featuredChannels.find((item) => item.id === id);
      if (!channel) return null;
      const image = <img src={images[id]} alt={channel.kind === "live" ? `استعرض قنوات ${channel.name}` : `استعرض محتوى ${channel.name}`} width={1920} height={710} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="block aspect-[1920/710] h-full w-full object-contain" />;
      const classes = "h-auto w-full overflow-hidden rounded-lg border border-sky/40 bg-surface-deep p-0 transition-transform hover:scale-[1.01] hover:border-sky focus-visible:ring-sky motion-reduce:transform-none";
      if (channel.kind !== "live") return <Button key={id} asChild variant="ghost" className={classes}><Link to="/vip" search={{ kind: channel.kind, q: channel.query }} aria-label={`استعرض محتوى ${channel.name}`}>{image}</Link></Button>;
      const query = id === "bein-sports-1" ? "bein" : id === "ssc-1" ? "SSC" : channel.query;
      return <Button key={id} type="button" variant="ghost" className={classes} aria-label={`استعرض قنوات ${channel.name}`} onClick={() => onBrowse(query)}>{image}</Button>;
    })}
  </section>;
}