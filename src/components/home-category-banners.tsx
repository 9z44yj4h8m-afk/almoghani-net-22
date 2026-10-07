import { Link } from "@tanstack/react-router";
import arabicMovies from "@/assets/home-categories/arabic-movies.png.asset.json";
import foreignMovies from "@/assets/home-categories/foreign-movies.png.asset.json";
import news from "@/assets/home-categories/news.png.asset.json";
import islamic from "@/assets/home-categories/islamic.png.asset.json";
import kids from "@/assets/home-categories/kids.png.asset.json";
import sports from "@/assets/home-categories/sports.png.asset.json";
import general from "@/assets/home-categories/general.png.asset.json";

export function HomeCategoryBanners() {
  return (
    <section
      id="home-category-banners"
      aria-label="أقسام المشاهدة"
      className="mx-auto grid max-w-4xl scroll-mt-24 grid-cols-1 gap-3 px-3 pt-5 sm:px-6"
    >
      {[
        { name: "الأفلام العربية", lang: "عربي" as const, image: arabicMovies.url },
        { name: "الأفلام الأجنبية", lang: "عالمي" as const, image: foreignMovies.url },
      ].map((item) => (
        <Link key={item.lang} to="/movies" search={{ lang: item.lang }} aria-label={item.name} className="block overflow-hidden rounded-xl border border-sky/30 focus-visible:outline-2 focus-visible:outline-sky">
          <img src={item.image} alt={item.name} className="block h-auto w-full" fetchPriority="high" />
        </Link>
      ))}
      {[
        { name: "القنوات الإخبارية", slug: "news", image: news.url },
        { name: "القنوات الإسلامية", slug: "islamic", image: islamic.url },
        { name: "قنوات الأطفال والوثائقية", slug: "kids", image: kids.url },
        { name: "القنوات الرياضية", slug: "sports", image: sports.url },
        { name: "القنوات العامة", slug: "general", image: general.url },
      ].map((item) => (
        <Link key={item.slug} to="/channels/$section" params={{ section: item.slug }} aria-label={item.name} className="block overflow-hidden rounded-xl border border-sky/30 focus-visible:outline-2 focus-visible:outline-sky">
          <img src={item.image} alt={item.name} className="block h-auto w-full" loading="lazy" />
        </Link>
      ))}
    </section>
  );
}
