import { useSiteConfig } from "@/lib/site-config";
import { orderedSectionIds, homeCategoryCards, getSectionCard } from "@/lib/section-content";

export function HomeCategoryBanners() {
  const { data } = useSiteConfig();
  return (
    <section
      id="home-category-banners"
      aria-label="أقسام المشاهدة"
      className="mx-auto grid max-w-4xl scroll-mt-24 grid-cols-1 gap-3 px-3 pt-5 sm:px-6"
    >
      {orderedSectionIds("categories", homeCategoryCards.map((b) => b.id), data?.sectionContent).map((id) => {
        const card = getSectionCard(`category-${id}`, data?.sectionContent);
        if (card.hidden) return null;
        return <a key={id} href={card.link} aria-label={card.title} className="design-gleam block overflow-hidden rounded-xl border border-sky/30 focus-visible:outline-2 focus-visible:outline-sky"><img src={card.image} alt={card.title} className="block h-auto w-full" loading="lazy" /></a>;
      })}
    </section>
  );
}
