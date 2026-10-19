import { useState } from "react";
import { Clapperboard, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberLibraryGate } from "@/components/member-library-gate";
import { SmartersLibrary } from "@/components/smarters-library";

export function SmartersPageCollection({ kind }: { kind: "movie" | "series" }) {
  const [open, setOpen] = useState(false);
  const title = kind === "movie" ? "أفلام سمارتر المغني" : "مسلسلات سمارتر المغني";
  const Icon = kind === "movie" ? Film : Clapperboard;
  return <section aria-label={title} className="mt-8 min-w-0 border-t border-border py-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-black"><Icon className="text-primary" />{title}</h2>
      <Button variant="outline" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Icon />}{open ? "إغلاق مكتبة سمارتر" : `عرض ${title}`}</Button>
    </div>
    {open && <MemberLibraryGate><SmartersLibrary embedded initialKind={kind} onCatalog={() => setOpen(false)} /></MemberLibraryGate>}
  </section>;
}
