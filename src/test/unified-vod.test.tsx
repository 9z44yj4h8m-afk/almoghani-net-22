import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: null as { id: string } | null, access: vi.fn(), resolve: vi.fn(), play: vi.fn() }));
vi.mock("@/components/member-provider", () => ({ useMember: () => ({ user: mocks.user, ready: true }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/lib/member.functions", () => ({ getMemberAccess: mocks.access }));
vi.mock("@/lib/iptv/library.functions", () => ({ resolveUnifiedVod: mocks.resolve, getUnifiedVodCatalog: vi.fn() }));
vi.mock("@/components/smarters-player", () => ({ SmartersPlayer: (props: unknown) => { mocks.play(props); return <p>مشاهدة</p>; } }));
import { UnifiedVodDialog } from "@/components/unified-vod";
const item = { id: "vod:test", title: "فيلم اختبار" };
function mount(kind: "movie" | "series") { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><UnifiedVodDialog kind={kind} item={item} onClose={() => undefined} /></QueryClientProvider>); }
afterEach(() => { cleanup(); mocks.user = null; vi.clearAllMocks(); });
describe("Unified VOD selected playback", () => {
  it.each(["movie", "series"] as const)("never resolves private %s playback for visitors", async kind => {
    mount(kind); expect(await screen.findByText("دخول الأعضاء")).toBeDefined();
    expect(mocks.access).not.toHaveBeenCalled(); expect(mocks.resolve).not.toHaveBeenCalled(); expect(mocks.play).not.toHaveBeenCalled();
  });
  it("does not resolve VOD for a denied member", async () => {
    mocks.user = { id: "member" }; mocks.access.mockResolvedValue({ unlocked: false }); mount("movie");
    await screen.findByRole("alert"); expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it.each(["movie", "series"] as const)("resolves only the selected %s after member access", async kind => {
    mocks.user = { id: "member" }; mocks.access.mockResolvedValue({ unlocked: true }); mocks.resolve.mockResolvedValue({ items: [{ name: "اختبار", url: "https://example.test/allowed.mp4" }] }); mount(kind);
    await waitFor(() => expect(mocks.play).toHaveBeenCalledWith({ url: "https://example.test/allowed.mp4" }));
    expect(mocks.resolve).toHaveBeenCalledWith({ data: { kind, id: "vod:test" } });
  });
});