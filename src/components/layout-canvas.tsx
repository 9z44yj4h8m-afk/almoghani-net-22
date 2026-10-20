import { useEffect, useRef, useState, type PointerEvent as RPE } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Save, Trash2, RotateCcw, Pencil, X, Square, Image as ImageIcon, Type, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { safeHttpsImage } from "@/lib/site-config";
import { toast } from "sonner";

export type CanvasItem = {
  id: string;
  type: "tile" | "banner" | "shape" | "text";
  x: number; y: number; w: number; h: number; // percent of canvas
  label?: string; sub?: string; link?: string; image?: string; color?: string; radius?: number;
};

export const safeLink = (v?: string) => (v && /^\/(?!\/)[\w\-/?=&%.]*$/.test(v) ? v : "");
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const newId = () => Math.random().toString(36).slice(2, 9);

export function normalizeItems(raw: unknown): CanvasItem[] | null {
  if (!Array.isArray(raw)) return null;
  const types = ["tile", "banner", "shape", "text"];
  return raw.filter((r) => r && types.includes(r.type)).slice(0, 60).map((r) => ({
    id: String(r.id || newId()), type: r.type,
    x: clamp(Number(r.x) || 0, 0, 95), y: clamp(Number(r.y) || 0, 0, 95),
    w: clamp(Number(r.w) || 20, 4, 100), h: clamp(Number(r.h) || 20, 4, 100),
    label: String(r.label ?? "").slice(0, 80), sub: String(r.sub ?? "").slice(0, 80),
    link: safeLink(r.link), image: safeHttpsImage(r.image),
    color: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#1e3a8a",
    radius: clamp(Number(r.radius ?? 18), 0, 60),
  }));
}

function useIsAdmin() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }).then(({ data: ok }) => setAdmin(!!ok));
    });
  }, []);
  return admin;
}

const presets: Record<CanvasItem["type"], Partial<CanvasItem>> = {
  tile: { w: 26, h: 40, label: "مربع جديد", sub: "", link: "/live", color: "#1e3a8a" },
  banner: { w: 90, h: 22, label: "بنر جديد", sub: "", link: "/movies", color: "#7c2d12" },
  shape: { w: 15, h: 15, color: "#0e7490", radius: 999 },
  text: { w: 40, h: 10, label: "نص جديد", color: "#ffffff" },
};

export function LayoutCanvas({ settingsKey, defaults }: { settingsKey: string; defaults: CanvasItem[] }) {
  const admin = useIsAdmin();
  const [items, setItems] = useState<CanvasItem[]>(defaults);
  const [saved, setSaved] = useState<CanvasItem[]>(defaults);
  const [edit, setEdit] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; mode: "move" | "size"; sx: number; sy: number; o: CanvasItem } | null>(null);

  useEffect(() => {
    void supabase.from("site_settings").select("value").eq("key", settingsKey).maybeSingle().then(({ data }) => {
      const n = normalizeItems((data?.value as { items?: unknown } | null)?.items);
      if (n) { setItems(n); setSaved(n); }
    });
  }, [settingsKey]);

  const update = (id: string, p: Partial<CanvasItem>) => setItems((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const start = (e: RPE, it: CanvasItem, mode: "move" | "size") => {
    if (!edit) return;
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSel(it.id);
    drag.current = { id: it.id, mode, sx: e.clientX, sy: e.clientY, o: it };
  };
  const move = (e: RPE) => {
    const d = drag.current; const r = box.current?.getBoundingClientRect();
    if (!d || !r) return;
    const dx = ((e.clientX - d.sx) / r.width) * 100, dy = ((e.clientY - d.sy) / r.height) * 100;
    if (d.mode === "move") update(d.id, { x: clamp(d.o.x + dx, 0, 100 - d.o.w), y: clamp(d.o.y + dy, 0, 100 - Math.min(d.o.h, 100)) });
    else update(d.id, { w: clamp(d.o.w + dx, 4, 100 - d.o.x), h: clamp(d.o.h + dy, 4, 100) });
  };
  const add = (type: CanvasItem["type"]) => {
    const it = { id: newId(), type, x: 5, y: 5, ...presets[type] } as CanvasItem;
    setItems((l) => [...l, it]); setSel(it.id);
  };
  const save = async () => {
    const clean = normalizeItems(items) ?? [];
    const { error } = await supabase.from("site_settings").upsert({ key: settingsKey, value: { items: clean }, updated_at: new Date().toISOString() });
    if (error) { toast.error("ما انحفظ: " + error.message); return; }
    setSaved(clean); toast.success("انحفظ التصميم");
  };
  const cur = items.find((i) => i.id === sel);

  return <div className="lc-wrap">
    {admin && <div className="lc-bar" dir="rtl">
      {!edit ? <button className="lc-btn" onClick={() => setEdit(true)}><Pencil />تعديل التصميم</button> : <>
        <button className="lc-btn" onClick={() => add("tile")}><LayoutGrid />مربع</button>
        <button className="lc-btn" onClick={() => add("banner")}><ImageIcon />بنر</button>
        <button className="lc-btn" onClick={() => add("shape")}><Square />شكل</button>
        <button className="lc-btn" onClick={() => add("text")}><Type />نص</button>
        <button className="lc-btn lc-save" onClick={save}><Save />حفظ</button>
        <button className="lc-btn" onClick={() => { setItems(saved); setSel(null); }}><RotateCcw />تراجع</button>
        <button className="lc-btn" onClick={() => { if (confirm("ترجع التصميم الأصلي؟")) setItems(defaults); }}><Plus className="rotate-45" />الأصلي</button>
        <button className="lc-btn" onClick={() => { setEdit(false); setSel(null); }}><X />إغلاق</button>
      </>}
    </div>}
    <div ref={box} className={`lc-canvas${edit ? " lc-editing" : ""}`} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerDown={() => edit && setSel(null)}>
      {items.map((it) => {
        const style = { left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, height: `${it.h}%`, borderRadius: it.radius, ...(it.type === "text" ? { color: it.color } : { background: it.image ? `center/cover url("${it.image}")` : `linear-gradient(135deg, ${it.color}, ${it.color}99)` }) };
        const inner = <>{it.type !== "shape" && <><strong>{it.label}</strong>{it.sub && <span>{it.sub}</span>}</>}</>;
        const cls = `lc-item lc-${it.type}${sel === it.id && edit ? " lc-sel" : ""}`;
        return <div key={it.id} className={cls} style={style} onPointerDown={(e) => start(e, it, "move")} dir="rtl">
          {!edit && it.link ? <Link to={it.link} preload="intent" className="lc-fill">{inner}</Link> : <div className="lc-fill">{inner}</div>}
          {edit && <span className="lc-handle" onPointerDown={(e) => start(e, it, "size")} />}
        </div>;
      })}
    </div>
    {edit && cur && <div className="lc-panel" dir="rtl">
      {cur.type !== "shape" && <label>النص<input value={cur.label} onChange={(e) => update(cur.id, { label: e.target.value })} /></label>}
      {(cur.type === "tile" || cur.type === "banner") && <>
        <label>نص صغير<input value={cur.sub} onChange={(e) => update(cur.id, { sub: e.target.value })} /></label>
        <label>يفتح صفحة<input dir="ltr" placeholder="/movies" value={cur.link} onChange={(e) => update(cur.id, { link: e.target.value })} /></label>
        <label>رابط صورة<input dir="ltr" placeholder="https://..." value={cur.image} onChange={(e) => update(cur.id, { image: e.target.value })} /></label>
      </>}
      <label>اللون<input type="color" value={cur.color} onChange={(e) => update(cur.id, { color: e.target.value })} /></label>
      <label>تدوير الزوايا<input type="range" min={0} max={60} value={Math.min(cur.radius ?? 18, 60)} onChange={(e) => update(cur.id, { radius: Number(e.target.value) })} /></label>
      <button className="lc-btn lc-del" onClick={() => { setItems((l) => l.filter((i) => i.id !== cur.id)); setSel(null); }}><Trash2 />حذف</button>
    </div>}
  </div>;
}
