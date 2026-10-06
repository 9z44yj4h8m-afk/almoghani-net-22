import { Globe2, Play, Radio, Signal, Trophy, Tv, Zap } from "lucide-react";
import arenaImage from "@/assets/broadcast-arena.jpg";
import { Button } from "@/components/ui/button";
import { LivePlayer } from "@/components/live-player";
import type { Channel } from "@/lib/channels";

export function BroadcastHero({ channel, active, onWatch, sectionTitle }: {
  channel: Channel;
  active: boolean;
  onWatch: () => void;
  sectionTitle?: string | undefined;
}) {
  return (
    <section id="player" className="broadcast-hero relative isolate scroll-mt-20 overflow-hidden border-b border-border">
      <img src={arenaImage} alt="ساحة بث مضاءة بالبنفسجي والسماوي" width={1920} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="arena-shade absolute inset-0 -z-10" />
      <div className="arena-layout mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-9 lg:px-12 lg:py-14" dir="ltr">
        <div className="arena-intro min-w-0" dir="rtl">
          <p className="mb-3 flex flex-wrap items-center justify-end gap-3 text-xs font-bold text-muted-foreground"><span>القنوات</span><span className="text-primary">·</span><span>الأفلام</span><span className="text-primary">·</span><span>عالم واحد</span></p>
          <p className="mb-3 font-display text-sm font-extrabold text-sky" dir="ltr">ALMOGHANI LIVE</p>
          <h1 className="font-display text-3xl font-black leading-[1.45] sm:text-5xl lg:text-4xl xl:text-5xl">{sectionTitle ?? "البث المباشر"}<span className="arena-title block">كما ينبغي أن يكون</span></h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">قنواتك المفضلة، الأخبار والرياضة والأفلام.<br className="hidden lg:block" /> كل ما تحب متابعته، في مكان واحد.</p>
          <div className="mt-4 grid grid-cols-4 gap-3 border-t border-foreground/10 pt-4 sm:mt-7 sm:pt-6 lg:mt-9">
            {[
              { Icon: Globe2, title: "من حول العالم", detail: "قنوات متنوعة" },
              { Icon: Trophy, title: "عالم الرياضة", detail: "أحداث ومنافسات" },
              { Icon: Tv, title: "مكتبة سمارتر", detail: "أفلام ومسلسلات" },
              { Icon: Zap, title: "بث مباشر", detail: "لحظة بلحظة" },
            ].map(({ Icon, title, detail }) => <div key={title} className="text-center"><span className="arena-feature mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-primary/40 bg-background/40"><Icon className="h-5 w-5" /></span><p className="text-[11px] font-bold sm:text-xs">{title}</p><p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{detail}</p></div>)}
          </div>
        </div>
        <div className="min-w-0" dir="rtl">
          <div className="arena-player-frame">
            {active ? <LivePlayer key={channel.id} channel={channel} /> : <div className="relative aspect-video overflow-hidden">
              <img src={arenaImage} alt="معاينة ساحة البث" width={1920} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-player-overlay" />
              <span className="live-badge absolute left-4 top-4"><span className="h-2 w-2 rounded-full bg-live-foreground" />LIVE</span>
              <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-md border border-foreground/15 bg-background/70 px-3 py-1.5 text-xs font-bold"><Radio className="h-3.5 w-3.5 text-sky" />القنوات المباشرة</span>
              <Button variant="broadcast" size="icon" onClick={onWatch} aria-label={`شغّل ${channel.name}`} className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full [&_svg]:size-7"><Play className="fill-current" /></Button>
            </div>}
            <div className="flex min-h-14 items-center gap-3 border-t border-foreground/10 bg-background/85 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-sky"><Signal className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{channel.name}</span><span className="block truncate text-[11px] text-muted-foreground">{channel.description}</span></span>
              <span className="mr-auto flex shrink-0 items-center gap-1.5 text-[10px] text-sky"><span className="h-1.5 w-1.5 rounded-full bg-sky" />{active ? "المشغّل" : "جاهز للمشاهدة"}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button variant="broadcast" size="lg" onClick={onWatch} className="h-14 w-full max-w-80 rounded-full font-display text-xl font-black [&_svg]:size-6"><span>{active ? "تابع البث" : "شاهد الآن"}</span><Play className="fill-current" /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}