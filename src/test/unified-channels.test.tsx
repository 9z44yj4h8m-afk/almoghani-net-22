import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "@/lib/channels";
import { mergeLiveChannels, smartersCategory } from "@/lib/unified-channels";

const mocks = vi.hoisted(() => ({ user: null as { id: string } | null, access: vi.fn(), resolve: vi.fn(), play: vi.fn() }));
vi.mock("@/components/member-provider", () => ({ useMember: () => ({ user: mocks.user, ready: true }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/lib/member.functions", () => ({ getMemberAccess: mocks.access }));
vi.mock("@/lib/iptv/library.functions", () => ({ resolveUnifiedLiveChannel: mocks.resolve }));
vi.mock("@/components/smarters-player", () => ({ SmartersPlayer: (props: unknown) => { mocks.play(props); return null; } }));
import { UnifiedMemberPlayer } from "@/components/unified-member-player";

function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><UnifiedMemberPlayer channelId="smarters:test" /></QueryClientProvider>); }
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.user = null; });
describe("Unified live channels", () => {
  it("places Smarters between site channels in one list without dropping any channels", () => {
    const channel = (id: string): Channel => ({ id, name: id, category: "إخبارية", thumbnail: "", description: "" });
    const merged = mergeLiveChannels([channel("site1"), channel("site2")], [channel("smarters:1"), channel("smarters:2"), channel("smarters:3")]);
    expect(merged.map(item => item.id)).toEqual(["site1", "smarters:1", "site2", "smarters:2", "smarters:3"]);
    expect(merged.every(item => item.streamUrl === undefined)).toBe(true);
  });
  it("keeps sports in the shared sports category", () => { expect(smartersCategory("beIN SPORTS")).toBe("رياضية"); });
  it("never resolves a private stream for a visitor", async () => {
    mount(); await waitFor(() => expect(mocks.access).not.toHaveBeenCalled());
    expect(mocks.resolve).not.toHaveBeenCalled(); expect(mocks.play).not.toHaveBeenCalled();
  });
  it("never resolves a private stream for a locked member", async () => {
    mocks.user = { id: "member" }; mocks.access.mockResolvedValue({ unlocked: false });
    mount(); await waitFor(() => expect(mocks.access).toHaveBeenCalled());
    expect(mocks.resolve).not.toHaveBeenCalled(); expect(mocks.play).not.toHaveBeenCalled();
  });
  it("resolves the selected channel only after member access and plays it inline", async () => {
    mocks.user = { id: "member" }; mocks.access.mockResolvedValue({ unlocked: true }); mocks.resolve.mockResolvedValue({ url: "https://example.test/live/authorized.m3u8" });
    mount(); await waitFor(() => expect(mocks.play).toHaveBeenCalledWith({ url: "https://example.test/live/authorized.m3u8" }));
    expect(mocks.resolve).toHaveBeenCalledWith({ data: { id: "smarters:test" } });
  });
});