import { GENRES, itemGenre, orderedGenres, moveGenre, type Genre, type SmartersConfig } from "@/lib/iptv/smarters-config";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminSmartersGroups, adminSmartersItems, loadSmartersConfig, saveSmartersConfig } from "@/lib/iptv/smarters-admin.functions";

type Kind = "live" | "movie" | "series";
type Config = SmartersConfig;
const KINDS: { id: Kind; label: string }[] = [
  { id: "live", label: "القنوات" },
  { id: "movie", label: "الأفلام" },
  { id: "series", label: "المسلسلات" },
];
const input = "h-10 w-full rounded-lg border border-border bg-card px-3 text-foreground outline-none focus:border-primary";

export function SmartersManager() {
  const fetchGroups = useServerFn(adminSmartersGroups);
  const fetchItems = useServerFn(adminSmartersItems);
  const fetchConfig = useServerFn(loadSmartersConfig);
  const save = useServerFn(saveSmartersConfig);
  const [kind, setKind] = useState<Kind>("live");
  const [cfg, setCfg] = useState<Config>({ groups: {}, items: {} });
  const [groups, setGroups] = useState<{ name: string; count: number }[]>([]);
  const [group, setGroup] = useState("");
  const [genre, setGenre] = useState<Genre | "">("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<{ id: number; name: string; group: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void fetchConfig().then(setCfg).catch(() => setMsg("تعذّر تحميل الإعدادات.")); }, [fetchConfig]);
  useEffect(() => { setGroup(""); setGenre(""); setItems([]); void fetchGroups({ data: { kind } }).then(setGroups).catch(() => setMsg("تعذّر تحميل الأقسام.")); }, [kind, fetchGroups]);
  useEffect(() => {
    if (!group && !genre && q.trim().length < 2) { setItems([]); setTotal(0); return; }
    const t = setTimeout(() => { void fetchItems({ data: { kind, group, q, genre: genre || undefined } }).then((r) => { setItems(r.items); setTotal(r.total); }).catch(() => setMsg("تعذّر تحميل المحتوى.")); }, 300);
    return () => clearTimeout(t);
  }, [kind, group, q, genre, fetchItems]);

  const gk = (name: string) => `${kind}:${name}`;
  const ik = (id: number) => `${kind}:${id}`;
  const ordered = [...groups].map((g, i) => ({ ...g, order: cfg.groups[gk(g.name)]?.order ?? 1_000_000 + i }))
    .sort((a, b) => a.order - b.order);

  function setGroupCfg(name: string, patch: Config["groups"][string]) {
    setCfg((c) => ({ ...c, groups: { ...c.groups, [gk(name)]: { ...c.groups[gk(name)], ...patch } } }));
  }
  function setItemCfg(id: number, patch: Config["items"][string]) {
    setCfg((c) => ({ ...c, items: { ...c.items, [ik(id)]: { ...c.items[ik(id)], ...patch } } }));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...ordered];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const a = next[index], b = next[j]; if (!a || !b) return; next[index] = b; next[j] = a;
    setCfg((c) => {
      const g = { ...c.groups };
      next.forEach((row, i) => { g[gk(row.name)] = { ...g[gk(row.name)], order: i }; });
      return { ...c, groups: g };
    });
  }
  const orderedItems = [...items].map((it, i) => ({ ...it, order: cfg.items[ik(it.id)]?.order ?? 1_000_000 + i })).sort((a, b) => a.order - b.order);
  const canSortItems = (!!group || !!genre) && !q.trim();
  function moveItem(index: number, dir: -1 | 1) {
    const next = [...orderedItems];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const a = next[index], b = next[j]; if (!a || !b) return; next[index] = b; next[j] = a;
    setCfg((c) => {
      const m = { ...c.items };
      next.forEach((row, i) => { m[ik(row.id)] = { ...m[ik(row.id)], order: i }; });
      return { ...c, items: m };
    });
  }
  async function persist() {
    setBusy(true); setMsg("");
    try { await save({ data: cfg }); window.dispatchEvent(new Event("smarters-config-saved")); setMsg("تم الحفظ ✓ — الترتيب الجديد يظهر في المكتبة فورًا بعد تحديثها."); }
    catch (e) { setMsg(e instanceof Error && e.message ? e.message : "تعذّر الحفظ."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2">
      {KINDS.map((k) => <Button key={k.id} variant={kind === k.id ? "default" : "outline"} onClick={() => setKind(k.id)}>{k.label}</Button>)}
      <Button className="ms-auto" onClick={() => void persist()} disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ تغييرات سمارتر"}</Button>
    </div>
    {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}

    {kind !== "live" && <section aria-label="إدارة الأنواع" className="space-y-3 border-b border-border pb-4">
      <h2 className="font-black">الأنواع</h2>
      <Button size="sm" variant={!genre ? "default" : "outline"} onClick={() => setGenre("")}>كل الأنواع</Button>
      <ul className="divide-y divide-border">{orderedGenres(kind, cfg).map((g, i, all) => <li key={g.id} className="flex items-center gap-2 py-2">
        <Button variant={genre === g.id ? "default" : "ghost"} onClick={() => { setGenre(g.id); setGroup(""); }}>{g.label}</Button>
        <Button variant="ghost" size="icon" disabled={i === 0} aria-label={`تقديم ${g.label}`} onClick={() => setCfg((c) => moveGenre(kind, c, i, -1))}><ArrowUp className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" disabled={i === all.length - 1} aria-label={`تأخير ${g.label}`} onClick={() => setCfg((c) => moveGenre(kind, c, i, 1))}><ArrowDown className="h-4 w-4" /></Button>
      </li>)}</ul>
    </section>}
    <section className="rounded-2xl border border-border bg-card/50 p-4">
      <h2 className="mb-1 font-black">الأقسام ({groups.length})</h2>
      <p className="mb-3 text-sm text-muted-foreground">غيّر الاسم، أخفِ القسم، أو قدّمه وأخّره. اضغط اسم القسم لعرض محتواه تحت.</p>
      <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
        {ordered.map((g, i) => {
          const c = cfg.groups[gk(g.name)] ?? {};
          return <li key={g.name} className={`flex flex-wrap items-center gap-2 py-2 ${c.hidden ? "opacity-50" : ""}`}>
            <button type="button" className={`min-w-0 flex-1 text-start ${group === g.name ? "text-primary" : ""}`} onClick={() => setGroup(group === g.name ? "" : g.name)}>
              <b className="block truncate">{c.label || g.name}</b>
              <span className="block text-xs text-muted-foreground">{c.label ? `الأصلي: ${g.name} · ` : ""}{g.count.toLocaleString("ar")}</span>
            </button>
            <Button size="icon" variant="ghost" aria-label="تقديم" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="تأخير" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
            {kind !== "live" && <select aria-label={`نوع القسم ${g.name}`} className="h-10 max-w-32 rounded-md border border-border bg-card px-2 text-foreground" value={c.genre ?? "auto"} onChange={(e) => setGroupCfg(g.name, { genre: e.target.value === "auto" ? undefined : e.target.value as Genre | "" })}>
              <option value="auto">تلقائي</option><option value="">دون نوع</option>{GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>}
            <Button size="icon" variant="ghost" aria-label="تغيير الاسم" onClick={() => { const v = window.prompt("اسم القسم (اتركه فارغًا للاسم الأصلي)", c.label ?? g.name); if (v !== null) setGroupCfg(g.name, { label: v.trim() === g.name ? "" : v.trim().slice(0, 120) }); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label={c.hidden ? "إظهار" : "إخفاء"} onClick={() => setGroupCfg(g.name, { hidden: !c.hidden })}>{c.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
          </li>;
        })}
      </ul>
    </section>

    <section className="rounded-2xl border border-border bg-card/50 p-4">
      <h2 className="mb-3 font-black">{kind === "live" ? "القنوات" : kind === "movie" ? "الأفلام" : "المسلسلات"}{group ? ` — ${cfg.groups[gk(group)]?.label || group}` : ""}</h2>
      <p className="mb-2 text-xs text-muted-foreground">للترتيب اليدوي: اختر قسمًا واترك البحث فاضيًا، ثم استخدم الأسهم واحفظ.</p>
      <input className={input} placeholder="ابحث بالاسم (حرفين أو أكثر)…" value={q} onChange={(e) => setQ(e.target.value)} />
      {total > items.length && <p className="mt-2 text-xs text-muted-foreground">يظهر أول {items.length} من {total.toLocaleString("ar")} — اكتب اسمًا لتضييق النتائج.</p>}
      <ul className="mt-3 max-h-[60vh] divide-y divide-border overflow-y-auto">
        {orderedItems.map((it, idx) => {
          const c = cfg.items[ik(it.id)] ?? {};
          return <li key={it.id} className={`flex items-center gap-2 py-2 ${c.hidden ? "opacity-50" : ""}`}>
            <span className="min-w-0 flex-1"><b className="block truncate">{c.label || it.name}</b>{c.label && <span className="block truncate text-xs text-muted-foreground">الأصلي: {it.name}</span>}</span>
            {kind !== "live" && <select aria-label={`نوع ${it.name}`} className="h-10 max-w-32 rounded-md border border-border bg-card px-2 text-foreground" value={c.genre ?? "auto"} onChange={(e) => setItemCfg(it.id, { genre: e.target.value === "auto" ? undefined : e.target.value as Genre | "" })}>
              <option value="auto">{itemGenre(kind, it.id, it.group, cfg) ? `تلقائي: ${GENRES.find((g) => g.id === itemGenre(kind, it.id, it.group, cfg))?.label}` : "تلقائي"}</option><option value="">دون نوع</option>{GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>}
            {canSortItems && <><Button size="icon" variant="ghost" aria-label="تقديم" onClick={() => moveItem(idx, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="تأخير" onClick={() => moveItem(idx, 1)}><ArrowDown className="h-4 w-4" /></Button></>}
            <Button size="icon" variant="ghost" aria-label="تغيير الاسم" onClick={() => { const v = window.prompt("الاسم (اتركه فارغًا للاسم الأصلي)", c.label ?? it.name); if (v !== null) setItemCfg(it.id, { label: v.trim() === it.name ? "" : v.trim().slice(0, 200) }); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label={c.hidden ? "إظهار" : "إخفاء"} onClick={() => setItemCfg(it.id, { hidden: !c.hidden })}>{c.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
          </li>;
        })}
        {!items.length && <li className="py-4 text-sm text-muted-foreground">اختر قسمًا من فوق أو ابحث بالاسم.</li>}
      </ul>
    </section>
  </div>;
}
