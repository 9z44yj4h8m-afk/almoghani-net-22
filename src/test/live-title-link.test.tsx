import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "@/lib/channels";
vi.mock("@/components/broadcast-hero", () => ({ BroadcastHero: () => null }));
import { IptvWorkspace } from "@/components/iptv-workspace";

const channel: Channel = { id: "mbc1", name: "MBC 1", category: "عامة", thumbnail: "", description: "" };
const base = { channels: [channel], sections: [], selected: channel, active: false, onWatch: () => undefined, onSelect: () => undefined, favorites: [] as string[], onFavorite: () => undefined };
afterEach(cleanup);

describe("Broadcast title opens the live page", () => {
  it("renders the supplied title link pointing at the live broadcast", () => {
    render(<IptvWorkspace {...base} liveTitle={<a href="/live">البث المباشر</a>} />);
    const title = screen.getByRole("link", { name: "البث المباشر" });
    expect(title.getAttribute("href")).toBe("/live");
  });
  it("keeps a plain heading when the page already shows the live broadcast", () => {
    render(<IptvWorkspace {...base} />);
    expect(screen.queryByRole("link", { name: "البث المباشر" })).toBeNull();
    expect(screen.getByText("البث المباشر")).toBeDefined();
  });
});
