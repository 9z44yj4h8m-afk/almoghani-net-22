import { Link } from "@tanstack/react-router";
import { ChevronLeft, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import image from "@/assets/bedouin-drama-banner.jpg";

export function BedouinDramaBanner() {
  return <Button asChild variant="ghost" className="group relative block h-auto w-full overflow-hidden rounded-lg border border-sky/50 bg-surface-deep p-0 text-right hover:border-sky">
    <Link to="/bedouin-drama" aria-label="استعرض البدوية دراما">
      <img src={image} alt="البدوية دراما" width={1536} height={576} loading="lazy" decoding="async" className="aspect-[8/3] w-full object-cover" />
      <span className="absolute inset-0 bg-player-overlay" />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
        <span className="min-w-0"><span className="mb-1 flex items-center gap-2 text-xs font-bold text-foreground"><Clapperboard className="h-4 w-4" />ALMOGHANI LIVE</span><span className="block font-display text-2xl font-black text-foreground sm:text-3xl">البدوية دراما</span><span className="mt-1 block text-xs font-bold text-foreground sm:text-sm">المسلسلات البدوية · جميع الحلقات</span></span>
        <ChevronLeft className="h-7 w-7 shrink-0 text-foreground" />
      </span>
    </Link>
  </Button>;
}