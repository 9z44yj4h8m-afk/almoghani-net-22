import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
export function InlineStream({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || !url.startsWith("https://")) return;
    setError(false);
    let hls: Hls | undefined;
    if (/\.m3u8(?:\?|$)/i.test(url) && Hls.isSupported()) {
      hls = new Hls(); hls.loadSource(url); hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setError(true); });
    } else video.src = url;
    return () => { hls?.destroy(); video.pause(); video.removeAttribute("src"); video.load(); };
  }, [url]);
  return <div><video ref={ref} controls playsInline onError={() => setError(true)} className="aspect-video w-full bg-surface-deep" />{error && <p role="alert" className="mt-2 text-xs text-muted-foreground">تعذّر تشغيل المصدر؛ جرّب VLC أو Outplayer.</p>}</div>;
}