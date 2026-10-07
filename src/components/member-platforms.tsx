import { ArrowUpLeft } from "lucide-react";
import { useSiteConfig } from "@/lib/site-config";
import { getSectionCard } from "@/lib/section-content";
import { SectionCardStyle } from "@/components/section-card-style";

export function MemberPlatforms() {
  const { data } = useSiteConfig();
  return <section className="broadcast-destinations mx-auto w-full max-w-4xl pt-6" aria-label="منصات الأعضاء">
    {(["live", "movie", "series"] as const).map((kind) => {
      const id = `home-${kind}`;
      const card = getSectionCard(id, data?.sectionContent);
      return <a key={kind} href={`/vip?kind=${kind}`} data-section-card={id} className="broadcast-destination design-gleam group">
        <SectionCardStyle id={id} card={card} />
        <img src={card.image} alt="" loading="lazy" width={1152} height={576} />
        <span className="destination-copy"><span data-card-text="title" className="destination-title">{card.title}<ArrowUpLeft /></span>{card.description && <span data-card-text="description" className="destination-description">{card.description}</span>}<span data-card-text="button" className="destination-enter">{card.button}</span></span>
      </a>;
    })}
  </section>;
}