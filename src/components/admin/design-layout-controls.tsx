import { useEffect, useRef, useState } from "react";
import { ImagePlus, Monitor, Smartphone, Tv, RotateCcw, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { layoutFields } from "@/lib/site-layout";
import type { SiteDesign } from "@/lib/site-config";

export function DesignLayoutControls({ design, onChange, undo, redo, canUndo, canRedo, restore, canRestore }: {
  design: SiteDesign; onChange: (value: SiteDesign) => void; undo: () => void; redo: () => void;
  canUndo: boolean; canRedo: boolean; restore: () => void; canRestore: boolean;
}) {
  const [width, setWidth] = useState(1280);
  const [available, setAvailable] = useState(640);
  const frame = useRef<HTMLIFrameElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const send = () => frame.current?.contentWindow?.postMessage({ type: "almoghani-design-preview", design }, window.location.origin);
  useEffect(() => { send(); }, [design, width]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "almoghani-preview-ready") send();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [design]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setAvailable(entry.contentRect.width); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, available / width);
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      {layoutFields.map((field) => <label key={field.key} className="grid gap-2 text-sm font-bold">
        <span>{field.label}: {design.layout?.[field.key] ?? field.fallback} {field.unit}</span>
        <input aria-label={field.label} type="range" min={field.min} max={field.max} step={field.step}
          value={design.layout?.[field.key] ?? field.fallback}
          onChange={(event) => onChange({ ...design, layout: { ...design.layout, [field.key]: Number(event.target.value) } })} />
      </label>)}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="icon" title="تراجع" aria-label="تراجع" disabled={!canUndo} onClick={undo}><Undo2 /></Button>
      <Button type="button" variant="outline" size="icon" title="إعادة" aria-label="إعادة" disabled={!canRedo} onClick={redo}><Redo2 /></Button>
      <Button type="button" variant="outline" disabled={!canRestore} onClick={restore}><RotateCcw />التصميم المحفوظ السابق</Button>
      <Button type="button" variant="outline" onClick={() => { const { layout: _layout, ...rest } = design; onChange(rest); }}>المقاسات الأصلية</Button>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="حجم المعاينة">
      {[{ width: 390, label: "جوال", Icon: Smartphone }, { width: 1280, label: "كمبيوتر", Icon: Monitor }, { width: 1920, label: "تلفزيون", Icon: Tv }].map((mode) =>
        <Button key={mode.width} type="button" variant={width === mode.width ? "secondary" : "outline"} aria-pressed={width === mode.width} onClick={() => setWidth(mode.width)}><mode.Icon />{mode.label}</Button>)}
    </div>
    <div ref={host} className="design-preview-host" style={{ height: 800 * scale }}>
      <iframe ref={frame} title="معاينة التصميم" src="/design-preview?designPreview=1" onLoad={send}
        style={{ width, height: 800, transform: `scale(${scale})` }} className="design-preview-frame" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline"><a href="#admin-sections"><ImagePlus />صور وبطاقات وبنرات</a></Button>
      <Button asChild variant="outline"><a href="#admin-channel-images">صور القنوات</a></Button>
      <Button asChild variant="outline"><a href="#admin-channels">فحص وتعديل القنوات</a></Button>
      <Button asChild variant="outline"><a href="#admin-channel-order">ترتيب القنوات</a></Button>
    </div>
  </div>;
}