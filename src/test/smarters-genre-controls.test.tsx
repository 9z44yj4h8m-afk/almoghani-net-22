import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SmartersManager } from "@/components/admin/smarters-manager";
import { SmartersLibrary } from "@/components/smarters-library";

const api = vi.hoisted(() => ({ config: { groups: {}, items: {} } as Record<string, unknown>, save: vi.fn(), search: vi.fn(), titles: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/lib/iptv/smarters-admin.functions", () => ({
  loadSmartersConfig: async () => api.config,
  adminSmartersGroups: async () => [{ name: "أفلام عربية", count: 1 }],
  adminSmartersItems: async () => ({ total: 1, items: [{ id: 12, name: "فيلم اختبار", group: "أفلام عربية" }] }),
  saveSmartersConfig: api.save,
}));
vi.mock("@/lib/iptv/library.functions", () => ({
  getLibraryGenres: async () => [{ id: "action", label: "أكشن", count: 1 }, { id: "comedy", label: "كوميديا", count: 1 }, { id: "drama", label: "دراما", count: 1 }],
  getLibraryGroups: async () => [], searchLibrary: api.search, getLibraryTitles: api.titles,
}));
vi.mock("@/components/smarters-player", () => ({ SmartersPlayer: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); api.config = { groups: {}, items: {} }; });

it("saves a manual film genre assignment and genre navigation order", async () => {
  api.save.mockResolvedValue({ ok: true });
  render(<SmartersManager />);
  fireEvent.click(screen.getByRole("button", { name: /^الأفلام$/ }));
  fireEvent.click(await screen.findByRole("button", { name: "تقديم أكشن" }));
  fireEvent.click(screen.getByText("أفلام عربية", { exact: true }));
  fireEvent.change(await screen.findByLabelText("نوع فيلم اختبار"), { target: { value: "comedy" } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ تغييرات سمارتر" }));
  await waitFor(() => expect(api.save).toHaveBeenCalled());
  expect(api.save.mock.calls[0]?.[0]?.data.items["movie:12"].genre).toBe("comedy");
  expect(api.save.mock.calls[0]?.[0]?.data.genreOrders.movie).toEqual(["comedy", "action", "drama"]);
});

it("passes comedy to film search and drama to series-title search", async () => {
  api.search.mockResolvedValue({ total: 0, items: [] });
  api.titles.mockResolvedValue({ total: 0, titles: [] });
  render(<QueryClientProvider client={new QueryClient()}><SmartersLibrary onCatalog={() => undefined} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: /^الأفلام$/ }));
  fireEvent.click(await screen.findByRole("button", { name: /كوميديا/ }));
  await waitFor(() => expect(api.search).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ kind: "movie", genre: "comedy" }) })));
  fireEvent.click(screen.getByRole("button", { name: /^المسلسلات$/ }));
  fireEvent.click(await screen.findByRole("button", { name: /دراما/ }));
  await waitFor(() => expect(api.titles).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ kind: "series", genre: "drama" }) })));
});