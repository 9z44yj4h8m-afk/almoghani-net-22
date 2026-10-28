export type SiteLayout = { columns?: number; cardHeight?: number; cardGap?: number; rowGap?: number; pageInset?: number; categoryWidth?: number };

export const layoutFields = [
  { key: "columns", label: "عدد البطاقات في الصف", min: 2, max: 10, step: 1, fallback: 6, unit: "" },
  { key: "cardHeight", label: "ارتفاع البطاقات", min: 100, max: 400, step: 10, fallback: 170, unit: "px" },
  { key: "cardGap", label: "المسافة بين البطاقات", min: 0, max: 40, step: 2, fallback: 12, unit: "px" },
  { key: "rowGap", label: "المسافة بين الصفوف", min: 0, max: 60, step: 2, fallback: 20, unit: "px" },
  { key: "pageInset", label: "المسافة على جانبي الصفحة", min: 0, max: 60, step: 2, fallback: 24, unit: "px" },
  { key: "categoryWidth", label: "عرض زر القسم", min: 150, max: 400, step: 10, fallback: 220, unit: "px" },
] as const;

/** Emit only bounded numeric owner overrides; absent values preserve the existing layout. */
export function siteLayoutCss(layout?: SiteLayout): string {
  if (!layout) return "";
  const declarations = layoutFields.flatMap((field) => {
    const value = layout[field.key];
    return typeof value === "number" && Number.isFinite(value)
      ? [`--owner-${field.key}:${Math.round(Math.min(field.max, Math.max(field.min, value)))}${field.key === "columns" ? "" : "px"};`]
      : [];
  });
  return declarations.length ? `.media-home{${declarations.join("")}}` : "";
}