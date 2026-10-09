import { Link } from "@tanstack/react-router";
import arabicMovies from "@/assets/home-categories/arabic-movies.png.asset.json";
import foreignMovies from "@/assets/home-categories/foreign-movies.png.asset.json";
import news from "@/assets/home-categories/news.png.asset.json";
import islamic from "@/assets/home-categories/islamic.png.asset.json";
import kids from "@/assets/home-categories/kids.png.asset.json";
import sports from "@/assets/home-categories/sports.png.asset.json";
import general from "@/assets/home-categories/general.png.asset.json";
import { useSiteConfig } from "@/lib/site-config";
import { orderedSectionIds } from "@/lib/section-content";

const banners = [
  { id: "arabic-movies", name: "الأفلام العربية", image: arabicMovies.url, lang: "عربي" as const },
  { id: "foreign-movies", name: "الأفلام الأجنبية", image: foreignMovies.url, lang: "عالمي" as const },
  { id: "news", name: "القنوات الإخبارية", image: news.url },
  { id: "islamic", name: "القنوات الإسلامية", image: islamic.url },
  { id: "kids", name: "قنوات الأطفال والوثائقية", image: kids.url },
  { id: "sports", name: "القنوات الرياضية", image: sports.url },
  { id: "general", name: "القنوات العامة", image: general.url },
];

export function HomeCategoryBanners() {
  const { data } = useSiteConfig();
  return (
    <section
      id="home-category-banners"
      aria-label="أقسام المشاهدة"
      className="mx-auto grid max-w-4xl scroll-mt-24 grid-cols-1 gap-3 px-3 pt-5 sm:px-6"
    >
      {orderedSectionIds("categories", banners.map((b) => b.id), data?.sectionContent).map((id) => {
        const item = banners.find((b) => b.id === id);
        if (!item || data?.sectionContent.cards[`category-${id}`]?.hidden) return null;
        const image = <img src={item.image} alt={item.name} className="block h-auto w-full" loading="lazy" />;
        const className = "design-gleam block overflow-hidden rounded-xl border border-sky/30 focus-visible:outline-2 focus-visible:outline-sky";
        return "lang" in item ? <Link key={id} to="/movies" search={{ lang: item.lang }} aria-label={item.name} className={className}>{image}</Link> : <Link key={id} to="/channels/$section" params={{ section: id }} aria-label={item.name} className={className}>{image}</Link>;
      })}
    </section>
  );
}
