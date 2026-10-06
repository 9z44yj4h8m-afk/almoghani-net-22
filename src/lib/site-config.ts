import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { channels as baseChannels, type Channel, type ChannelCategory } from "./channels";
import type { Movie } from "./movies";

export type SiteTexts = { bannerTitle: string; bannerSubtitle: string; proLabel: string };
export type SiteContacts = { whatsapp: string; email: string; snapchat: string; x: string; instagram: string };
export type SiteDesign = { primary: string; accent: string; background: string };

export const defaultTexts: SiteTexts = { bannerTitle: "almoghani smarter", bannerSubtitle: "جميع القنوات", proLabel: "Almoghani Smarter pro" };
export const defaultContacts: SiteContacts = { whatsapp: "0557073007", email: "a0552525337@gmail.com", snapchat: "", x: "", instagram: "" };
export const defaultDesign: SiteDesign = { primary: "", accent: "", background: "" };

export const channelCategories: ChannelCategory[] = ["إخبارية", "رياضية", "إسلامية", "مسلسلات وأفلام", "أفلام كاملة", "أطفال ووثائقي", "عامة"];

export type SiteConfig = {
  texts: SiteTexts;
  contacts: SiteContacts;
  design: SiteDesign;
  customChannels: { id: string; name: string; category: string; stream_url: string; logo: string; description: string }[];
  overrides: { channel_id: string; hidden: boolean; category: string | null }[];
  customMovies: { id: string; youtube_id: string; title: string; description: string }[];
  hiddenMovies: string[];
};

async function fetchSiteConfig(): Promise<SiteConfig> {
  const [settings, custom, overrides, movies, hidden] = await Promise.all([
    supabase.from("site_settings").select("key,value"),
    supabase.from("custom_channels").select("id,name,category,stream_url,logo,description").order("created_at"),
    supabase.from("channel_overrides").select("channel_id,hidden,category"),
    supabase.from("custom_movies").select("id,youtube_id,title,description").order("created_at", { ascending: false }),
    supabase.from("hidden_movies").select("movie_id"),
  ]);
  const get = <T,>(key: string, fallback: T): T => {
    const row = settings.data?.find((r) => r.key === key);
    return { ...fallback, ...((row?.value as Partial<T>) ?? {}) };
  };
  return {
    texts: get("texts", defaultTexts),
    contacts: get("contacts", defaultContacts),
    design: get("design", defaultDesign),
    customChannels: custom.data ?? [],
    overrides: overrides.data ?? [],
    customMovies: movies.data ?? [],
    hiddenMovies: (hidden.data ?? []).map((r) => r.movie_id),
  };
}

export const siteConfigKey = ["site-config"] as const;

export function useSiteConfig() {
  return useQuery({ queryKey: siteConfigKey, queryFn: fetchSiteConfig, staleTime: 60_000 });
}

export function youtubeIdFrom(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? (/^[A-Za-z0-9_-]{11}$/.test(url) ? url : null);
}

export function mergeChannels(config: SiteConfig | undefined): Channel[] {
  if (!config) return baseChannels;
  const ov = new Map(config.overrides.map((o) => [o.channel_id, o]));
  const base = baseChannels
    .filter((c) => !ov.get(c.id)?.hidden)
    .map((c) => {
      const cat = ov.get(c.id)?.category;
      return cat && channelCategories.includes(cat as ChannelCategory) ? { ...c, category: cat as ChannelCategory } : c;
    });
  const extra: Channel[] = config.customChannels
    .filter((c) => !ov.get(c.id)?.hidden)
    .map((c) => {
      const yt = youtubeIdFrom(c.stream_url);
      return {
        id: c.id,
        name: c.name,
        category: (channelCategories.includes(c.category as ChannelCategory) ? c.category : "عامة") as ChannelCategory,
        ...(yt ? { youtubeId: yt } : { streamUrl: c.stream_url }),
        thumbnail: c.logo || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : ""),
        description: c.description || "بث مباشر",
      };
    });
  return [...base, ...extra];
}

/** Full catalog with admin changes applied; falls back to the built-in list while loading. */
export function useCatalog(): Channel[] {
  const { data } = useSiteConfig();
  return mergeChannels(data);
}

export function applyMovieConfig(movies: Movie[], config: SiteConfig | undefined): Movie[] {
  if (!config) return movies;
  const hidden = new Set(config.hiddenMovies);
  const extra: Movie[] = config.customMovies.map((m) => ({
    id: `custom-${m.id}`,
    youtubeId: m.youtube_id,
    title: m.title,
    duration: "فيلم كامل",
    description: m.description,
    source: "ALMOGHANI",
    lang: "عربي",
  } as Movie));
  return [...extra, ...movies.filter((m) => !hidden.has(m.id))];
}
