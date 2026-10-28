import { describe, expect, it } from "vitest";
import { siteLayoutCss } from "@/lib/site-layout";

describe("owner layout settings", () => {
  it("preserves the current layout when no override is saved", () => {
    expect(siteLayoutCss()).toBe("");
    expect(siteLayoutCss({})).toBe("");
  });
  it("keeps zero spaces and the chosen card count", () => {
    const css = siteLayoutCss({ cardGap: 0, rowGap: 0, pageInset: 0, columns: 4 });
    expect(css).toContain("--owner-cardGap:0px;");
    expect(css).toContain("--owner-rowGap:0px;");
    expect(css).toContain("--owner-pageInset:0px;");
    expect(css).toContain("--owner-columns:4;");
  });
  it("bounds unsafe sizing and drops nonnumeric input", () => {
    expect(siteLayoutCss({ columns: 90, cardHeight: -1, cardGap: Number.NaN })).toBe(".media-home{--owner-columns:10;--owner-cardHeight:100px;}");
  });
});