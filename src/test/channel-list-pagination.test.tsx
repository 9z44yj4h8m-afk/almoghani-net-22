import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "@/lib/channels";
vi.mock("@/components/broadcast-hero", () => ({ BroadcastHero: () => null }));
import { IptvWorkspace } from "@/components/iptv-workspace";

afterEach(cleanup);
describe("Large public channel catalogs", () => {
  it("can select a channel beyond the first batch through full-catalog search", () => {
    const rows: Channel[] = Array.from({ length: 250 }, (_, i) => ({ id: `test-${i}`, name: `Channel ${i}`, category: "عامة", thumbnail: "", description: "" }));
    const selected = rows[0];
    if (!selected) throw new Error("Missing fixture");
    const select = vi.fn();
    render(<IptvWorkspace channels={rows} sections={[]} selected={selected} active={false} onWatch={() => undefined} onSelect={select} favorites={[]} onFavorite={() => undefined} />);
    fireEvent.change(screen.getByRole("textbox", { name: "بحث في قائمة القنوات" }), { target: { value: "Channel 249" } });
    fireEvent.click(screen.getByRole("button", { name: "شغّل Channel 249" }));
    expect(select).toHaveBeenCalledWith(rows[249]);
  });

  it("can select later channels after expanding the next batch", () => {
    const rows: Channel[] = Array.from({ length: 150 }, (_, i) => ({ id: `test-${i}`, name: `Channel ${i}`, category: "عامة", thumbnail: "", description: "" }));
    const selected = rows[0];
    if (!selected) throw new Error("Missing fixture");
    const select = vi.fn();
    render(<IptvWorkspace channels={rows} sections={[]} selected={selected} active={false} onWatch={() => undefined} onSelect={select} favorites={[]} onFavorite={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "عرض المزيد" }));
    fireEvent.click(screen.getByRole("button", { name: "شغّل Channel 149" }));
    expect(select).toHaveBeenCalledWith(rows[149]);
  });
});