import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemberLibraryGate } from "@/components/member-library-gate";

const mocks = vi.hoisted(() => ({ user: null as { id: string } | null, status: vi.fn(), unlock: vi.fn(), privateRead: vi.fn() }));
vi.mock("@/components/member-provider", () => ({ useMember: () => ({ user: mocks.user, ready: true }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/member.functions", () => ({ getMemberAccess: mocks.status, unlockMemberLibrary: mocks.unlock, lockMemberLibrary: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>, useNavigate: () => vi.fn() }));
vi.mock("@/components/install-app-button", () => ({ InstallAppButton: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signOut: vi.fn() } } }));

function Library() { mocks.privateRead(); return null; }
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemberLibraryGate><Library /></MemberLibraryGate></QueryClientProvider>);
}
afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); mocks.user = null; });
describe("Homepage Smarters member protection", () => {
  it("does not read private channels for a visitor", async () => {
    mount();
    await waitFor(() => expect(screen.getByText("دخول الأعضاء")).toBeDefined());
    expect(mocks.status).not.toHaveBeenCalled();
    expect(mocks.privateRead).not.toHaveBeenCalled();
  });
  it("does not read private channels when a member session is locked", async () => {
    mocks.user = { id: "member" };
    mocks.status.mockResolvedValue({ unlocked: false, name: "عضو" });
    sessionStorage.setItem("library-pin-ok", "member");
    mount();
    await waitFor(() => expect(mocks.status).toHaveBeenCalled());
    expect(mocks.privateRead).not.toHaveBeenCalled();
  });
  it("opens an authorized member library without PIN 0550 or browser unlock flags", async () => {
    mocks.user = { id: "member" };
    mocks.status.mockResolvedValue({ unlocked: true, name: "عضو" });
    mount();
    await waitFor(() => expect(mocks.privateRead).toHaveBeenCalled());
    expect(mocks.unlock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("library-pin-ok")).toBeNull();
  });
  it("does not read private content if the authenticated access check fails", async () => {
    mocks.user = { id: "member" };
    mocks.status.mockRejectedValue(new Error("Suspended"));
    mount();
    await screen.findByRole("alert");
    expect(mocks.privateRead).not.toHaveBeenCalled();
  });
});