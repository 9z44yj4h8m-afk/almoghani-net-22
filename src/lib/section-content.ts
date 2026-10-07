import liveImage from "@/assets/section-live.jpg";
import moviesImage from "@/assets/section-movies.jpg";
import seriesImage from "@/assets/section-series.jpg";
import memberImage from "@/assets/section-private.jpg";

export const sectionDestinations = [
  { value: "/live", label: "البث المباشر" },
  { value: "/movies", label: "أفلام مميزة كاملة" },
  { value: "/vip?kind=live", label: "بث سمارتر" },
  { value: "/vip?kind=movie", label: "أفلام سمارتر" },
  { value: "/vip?kind=series", label: "مسلسلات سمارتر" },
  { value: "/auth", label: "دخول الأعضاء" },
  { value: "/featured", label: "القنوات المميزة" },
  { value: "/sections", label: "الأقسام" },
  { value: "/contact", label: "التواصل" },
  { value: "/live-chat", label: "الدردشة" },
] as const;
export type SectionCard = { title: string; description: string; button: string; image: string; link: string; font?: string; titleSize?: number; descriptionSize?: number; buttonSize?: number; imageWidth?: number; imageHeight?: number; imageFit?: "cover" | "contain"; fontWeight?: number };
export type SectionContent = { cards: Record<string, Partial<SectionCard>>; titles: Record<string, string>; pageTitle: string; pageDescription: string };
export const defaultSectionContent: SectionContent = { cards: {}, titles: {}, pageTitle: "الأقسام", pageDescription: "اختر ما تريد مشاهدته" };
export const editableCards: { id: string; location: string; defaults: SectionCard }[] = [
  { id: "home-live", location: "الرئيسية · البث", defaults: { title: "البث المباشر", description: "جميع القنوات مرتبة داخل تصنيفات واضحة", button: "اضغط للدخول", image: liveImage, link: "/vip?kind=live" } },
  { id: "home-movie", location: "الرئيسية · الأفلام", defaults: { title: "مكتبة الأفلام", description: "", button: "اضغط للدخول", image: moviesImage, link: "/vip?kind=movie" } },
  { id: "home-series", location: "الرئيسية · المسلسلات", defaults: { title: "المسلسلات", description: "", button: "اضغط للدخول", image: seriesImage, link: "/vip?kind=series" } },
  { id: "sections-live", location: "صفحة الأقسام · البث", defaults: { title: "البث المباشر", description: "قنواتك المفضلة في مكان واحد", button: "استعرض القنوات", image: liveImage, link: "/live" } },
  { id: "sections-movie", location: "صفحة الأقسام · الأفلام", defaults: { title: "مكتبة الأفلام", description: "اكتشف عالم الأفلام", button: "استعرض الأفلام", image: moviesImage, link: "/movies" } },
  { id: "sections-series", location: "صفحة الأقسام · المسلسلات", defaults: { title: "المسلسلات", description: "تابع مسلسلاتك وحلقاتك المفضلة", button: "استعرض المسلسلات", image: seriesImage, link: "/vip?kind=series" } },
  { id: "sections-member", location: "صفحة الأقسام · الأعضاء", defaults: { title: "دخول الأعضاء", description: "سجّل دخولك بحسابك", button: "تسجيل الدخول", image: memberImage, link: "/auth" } },
];
export function getSectionCard(id: string, content?: SectionContent): SectionCard {
  const base = editableCards.find((c) => c.id === id)?.defaults ?? { title: "", description: "", button: "", image: liveImage, link: "/live" };
  const card = { ...base, ...content?.cards?.[id] };
  if (!card.image) card.image = base.image;
  if (!sectionDestinations.some((d) => d.value === card.link)) card.link = base.link;
  if (!/^(https:\/\/|\/)/.test(card.image) || card.image.startsWith("//")) card.image = base.image;
  return card;
}