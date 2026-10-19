import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
const mocks = vi.hoisted(() => ({ authorized: false, library: vi.fn() }));
vi.mock("@/components/member-library-gate", () => ({ MemberLibraryGate: ({ children }: { children: ReactNode }) => mocks.authorized ? children : <p>دخول الأعضاء</p> }));
vi.mock("@/components/smarters-library", () => ({ SmartersLibrary: (props: unknown) => { mocks.library(props); return null; } }));
import { SmartersPageCollection } from "@/components/smarters-page-collection";
afterEach(() => { cleanup(); mocks.authorized = false; vi.clearAllMocks(); });
describe("Smarters collections on public movie and series pages", () => {
  it("does not load private films for visitors", () => { render(<SmartersPageCollection kind="movie" />); fireEvent.click(screen.getByRole("button", { name: "عرض أفلام سمارتر المغني" })); expect(mocks.library).not.toHaveBeenCalled(); expect(screen.getByText("دخول الأعضاء")).toBeDefined(); });
  it.each(["movie", "series"] as const)("opens the correct %s library inside the current page for authorized members", kind => { mocks.authorized = true; render(<SmartersPageCollection kind={kind} />); fireEvent.click(screen.getByRole("button")); expect(mocks.library).toHaveBeenCalledWith(expect.objectContaining({ initialKind: kind, embedded: true })); });
});
