import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SmartersPlayer({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearStall = () => {
    clearTimeout(stallTimer.current);
    stallTimer.current = undefined;
  };
  const watchStall = () => {
    if (stallTimer.current !== undefined) return;
    stallTimer.current = setTimeout(() => { stallTimer.current = undefined; setFailed(true); }, 20_000);
  };
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setFailed(false);
    const isLive = url.includes("/live/");
    const target = isLive ? url.replace(/\.ts$/, ".m3u8") : url;
    const src = `/api/public/iptv?u=${encodeURIComponent(target)}`;
    let hls: { destroy: () => void } | undefined;
    let cancelled = false;
    watchStall();
    if (!isLive || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      void video.play().catch(() => { clearStall(); });
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { clearStall(); setFailed(true); return; }
        const h = new Hls();
        hls = h;
        h.on(Hls.Events.ERROR, (_event, data) => {
          if (!cancelled && data.fatal) { clearStall(); setFailed(true); }
        });
        h.loadSource(src);
        h.attachMedia(video);
        void video.play().catch(() => { clearStall(); });
      }).catch(() => { if (!cancelled) { clearStall(); setFailed(true); } });
    }
    return () => {
      cancelled = true;
      clearStall();
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [url, attempt]);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <video ref={ref} controls playsInline autoPlay aria-label="مشغّل سمارتر" className="aspect-video w-full bg-background"
        onError={() => { clearStall(); setFailed(true); }}
        onWaiting={watchStall} onStalled={watchStall} onPause={clearStall} onEnded={clearStall}
        onPlaying={() => { clearStall(); setFailed(false); }} />
      {failed && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
        <p className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-5 w-5 shrink-0" />تعذّر تشغيل البث أو انقطع الاتصال.</p>
        <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}><RotateCcw className="h-4 w-4" />إعادة المحاولة</Button>
      </div>}
    </div>
  );
}