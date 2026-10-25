import type { Channel } from "./channels";
import data from "./bulk-channels.json";

/** Public IPTV-org entries verified against HLS manifests and media samples. */
export const bulkChannels: Channel[] = data.map(row => ({ ...row, category: category(row.category) }));
function category(value: string): Channel["category"] {
  switch (value) {
    case "إخبارية": case "رياضية": case "إسلامية": case "مسلسلات وأفلام": case "أطفال ووثائقي": return value;
    default: return "عامة";
  }
}
