import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "@/lib/channels";
import { groupBeinChannels } from "@/lib/unified-channels";
vi.mock("@/components/broadcast-hero", () => ({ BroadcastHero: () => null }));
import { IptvWorkspace } from "@/components/iptv-workspace";
const make = (id: string, name: string): Channel => ({ id, name, category: "رياضية", thumbnail: "", description: "" });
const channels = [make("smarters:1", "BEIN SPORTS 1"), make("smarters:1eng", "BEIN SPORTS 1 ENGLISH"), make("smarters:2", "BEIN SPORT TOD 2"), make("smarters:2fr", "BEIN SPORTS 2 FRANCE"), make("espn", "ESPN")];
afterEach(cleanup);
describe("Numbered beIN branches", () => {
  it("groups each beIN number separately without dropping variants or unrelated channels", () => {
    const groups = groupBeinChannels(channels);
    expect(groups.map(group => group.channels.map(item => item.id))).toEqual([["smarters:1", "smarters:1eng"], ["smarters:2", "smarters:2fr"], ["espn"]]);
    expect(groups.map(group => group.name)).toEqual(["بي إن سبورت 1", "بي إن سبورت 2", "ESPN"]);
  });
  it("opens branches without selecting a stream, then selects the original branch ID", () => {
    const select = vi.fn();
    const selected = channels[0];
    if (!selected) throw new Error("Missing selected channel fixture");
    render(<IptvWorkspace channels={channels} sections={[]} selected={selected} active={false} onWatch={() => undefined} onSelect={select} favorites={[]} onFavorite={() => undefined} />);
    expect(screen.queryByRole("button", { name: "شغّل BEIN SPORTS 1 ENGLISH" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "فروع بي إن سبورت 1" }));
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "شغّل BEIN SPORTS 1 ENGLISH" }));
    expect(select).toHaveBeenCalledWith(channels[1]);
    fireEvent.click(screen.getByRole("button", { name: "فروع بي إن سبورت 2" }));
    expect(screen.getByRole("button", { name: "شغّل BEIN SPORTS 2 FRANCE" })).toBeDefined();
  });
});