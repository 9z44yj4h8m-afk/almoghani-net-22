import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn }; return builder; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/iptv/vod-catalog.server", () => ({ vodCatalogRows: vi.fn(async () => [
  { id: "vod:opaque1", row: ["فيلم عربي", "ARABIC MOVIES", "private-logo", 99, "mp4"] },
  { id: "vod:opaque2", row: ["World movie", "ENGLISH MOVIES", "private-logo", 100, "mp4"] },
]) }));
import { getUnifiedVodCatalog, resolveUnifiedVod } from "@/lib/iptv/library.functions";
const browse = getUnifiedVodCatalog as unknown as (args: { data: { kind: "movie" | "series"; q: string; page: number; lang?: string } }) => Promise<{ total: number; items: { id: string; title: string }[] }>;
describe("Safe merged VOD catalog", () => {
  it.each(["movie", "series"] as const)("publishes only opaque IDs and titles for %s", async kind => {
    expect(await browse({ data: { kind, q: "", page: 0 } })).toEqual({ total: 2, items: [{ id: "vod:opaque1", title: "فيلم عربي" }, { id: "vod:opaque2", title: "World movie" }] });
  });
  it("uses the common query and language filter", async () => {
    expect((await browse({ data: { kind: "movie", q: "عربي", page: 0, lang: "عربي" } })).items.map(item => item.title)).toEqual(["فيلم عربي"]);
    expect((await browse({ data: { kind: "movie", q: "عربي", page: 0, lang: "عالمي" } })).total).toBe(0);
  });
  it("rejects a closed library session before returning any stream", async () => {
    const query = { select: () => query, maybeSingle: async () => ({ data: { unlocked: false }, error: null }) };
    const resolve = resolveUnifiedVod as unknown as (args: unknown) => Promise<unknown>;
    await expect(resolve({ data: { kind: "movie", id: "vod:opaque1" }, context: { supabase: { from: () => query } } })).rejects.toThrow("تعذّر التحقق");
  });
});