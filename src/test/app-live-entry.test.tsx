import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({ search: {} as { kind?: string; group?: string }, homepage: vi.fn(), library: vi.fn(), gate: vi.fn(), authorized: false }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => ({ options, useSearch: () => mocks.search }) }));
vi.mock("@/components/portal-page", () => ({ PortalPage: (props: unknown) => { mocks.homepage(props); return null; } }));
vi.mock("@/components/smarters-library", () => ({ SmartersLibrary: (props: unknown) => { mocks.library(props); return null; } }));
vi.mock("@/components/member-library-gate", () => ({ MemberLibraryGate: ({ children }: { children: ReactNode }) => { mocks.gate(); return mocks.authorized ? children : null; } }));
import { Route } from "@/routes/vip";

function mount() {
  const Page = Route.options.component;
  if (!Page) throw new Error("Missing app entry");
  return render(<Page />);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.search = {}; mocks.authorized = false; });
describe("App live entry", () => {
  it("reuses the homepage experience by default", () => {
    mount();
    expect(mocks.homepage).toHaveBeenCalledWith(expect.objectContaining({ homepage: true }));
    expect(mocks.library).not.toHaveBeenCalled();
  });
  it("reuses the homepage for the live tab", () => {
    mocks.search = { kind: "live" };
    mount();
    expect(mocks.homepage).toHaveBeenCalledWith(expect.objectContaining({ homepage: true }));
  });
  it.each(["movie", "series"])("keeps %s deep links protected", (kind) => {
    mocks.search = { kind };
    mount();
    expect(mocks.gate).toHaveBeenCalled();
    expect(mocks.library).not.toHaveBeenCalled();
    expect(mocks.homepage).not.toHaveBeenCalled();
  });
  it("preserves the requested library group for authorized members", () => {
    mocks.search = { kind: "live", group: "رياضة" };
    mocks.authorized = true;
    mount();
    expect(mocks.library).toHaveBeenCalledWith(expect.objectContaining({ initialGroup: "رياضة" }));
  });
});