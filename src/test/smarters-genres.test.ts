import { beforeEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { GENRES, itemGenre, moveGenre, orderedGenres, smartersConfigSchema, type SmartersConfig } from "@/lib/iptv/smarters-config";

const state = vi.hoisted(() => ({ config: { groups: {}, items: {} } as SmartersConfig }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: state.config } }) }) }) }) } }));
vi.mock("@/lib/iptv/movie-data.server", async () => {
  const { gzipSync } = await import("node:zlib");
  return { default: gzipSync(JSON.stringify([["Comedy film", "COMEDY", "", 1, "mp4"], ["Drama film", "DRAMA", "", 2, "mp4"], ["Action film", "ACTION", "", 3, "mp4"], ["Comedy second", "COMEDY", "", 4, "mp4"]])).toString("base64") };
});
vi.mock("@/lib/iptv/series-data.server", async () => {
  const { gzipSync } = await import("node:zlib");
  return { default: gzipSync(JSON.stringify([["Funny series", "COMEDY", "", 10, "mp4"], ["Drama series", "DRAMA", "", 11, "mp4"]])).toString("base64") };
});
import { clearSmartersConfig, genresOf, loadKind, titles } from "@/lib/iptv/library.server";
beforeEach(() => { vi.stubGlobal("Blob", NodeBlob); state.config = { groups: {}, items: {} }; clearSmartersConfig(); });

describe("Smarters genres and manual ordering", () => {
  it("provides the requested comedy, drama and action genres", () => {
    expect(GENRES.map((g) => g.id)).toEqual(["comedy", "drama", "action"]);
  });
  it("saves independent manual genre order for movies and series", () => {
    const moved = moveGenre("movie", state.config, 2, -1);
    expect(orderedGenres("movie", moved).map((g) => g.id)).toEqual(["comedy", "action", "drama"]);
    expect(orderedGenres("series", moved).map((g) => g.id)).toEqual(["comedy", "drama", "action"]);
  });
  it("lets item genre override a manually assigned group genre", () => {
    state.config = { groups: { "movie:COMEDY": { genre: "drama" } }, items: { "movie:1": { genre: "action" } } };
    expect(itemGenre("movie", 1, "COMEDY", state.config)).toBe("action");
    expect(itemGenre("movie", 4, "COMEDY", state.config)).toBe("drama");
  });
  it("preserves manual film ordering inside comedy", async () => {
    state.config.items = { "movie:4": { order: 0 }, "movie:1": { order: 1 } };
    expect((await loadKind("movie", "comedy")).map((r) => r[3])).toEqual([4, 1]);
  });
  it("filters series at title level, without loading episodes", async () => {
    const result = await titles("series", "", 0, "drama");
    expect(result.titles.map((r) => r.name)).toEqual(["Drama series"]);
  });
  it("reads a saved genre change after invalidation and excludes hidden films", async () => {
    await genresOf("movie");
    state.config.items = { "movie:1": { genre: "action" }, "movie:3": { hidden: true } };
    clearSmartersConfig();
    expect((await loadKind("movie", "action")).map((r) => r[3])).toEqual([1]);
  });
  it("rejects unsupported genres before persistence", () => {
    expect(smartersConfigSchema.safeParse({ groups: {}, items: { "movie:1": { genre: "invalid" } } }).success).toBe(false);
  });
});