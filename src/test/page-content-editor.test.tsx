import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: null as { id: string } | null, roles: [] as { role: string }[], roleRead: vi.fn(), save: vi.fn(), config: { texts: {}, ticker: { enabled: true, text: "" }, customChannels: [], overrides: [] } }));
vi.mock("@/components/member-provider", () => ({ useMember: () => ({ user: mocks.user, ready: true }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (table: string) => ({ select: () => ({ eq: () => ({ eq: async () => { mocks.roleRead(table); return { data: mocks.roles, error: null }; } }) }), upsert: mocks.save }) } }));
vi.mock("@/lib/site-config", () => ({ useSiteConfig: () => ({ data: mocks.config }), channelCategories: ["إخبارية", "رياضية", "عامة"], siteConfigKey: ["site-config"], defaultTexts: {}, defaultTicker: { enabled: true, text: "" } }));
vi.mock("@/lib/channels", () => ({ channels: [{ id: "one", name: "قناة أولى", category: "إخبارية" }] }));
vi.mock("@/components/admin/channel-order-manager", () => ({ ChannelOrderManager: () => null }));
vi.mock("@/components/admin/channel-images-manager", () => ({ ChannelImagesManager: () => null }));
vi.mock("@/components/admin/section-editor", () => ({ SectionEditor: () => null }));
vi.mock("@/components/admin/schedule-manager", () => ({ ScheduleManager: () => null }));
import { OwnerEditablePage } from "@/components/admin/page-content-editor";
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><OwnerEditablePage>{edit => <span data-testid="editing">{edit ? "editing" : "viewing"}</span>}</OwnerEditablePage></QueryClientProvider>); }
afterEach(() => { cleanup(); mocks.user = null; mocks.roles = []; vi.clearAllMocks(); });
describe("Owner editing while browsing", () => {
  it("never queries owner roles or exposes editors to visitors", () => { mount(); expect(mocks.roleRead).not.toHaveBeenCalled(); expect(screen.getByTestId("editing").textContent).toBe("viewing"); });
  it("does not grant editing to ordinary members", async () => { mocks.user = { id: "member" }; mount(); await waitFor(() => expect(mocks.roleRead).toHaveBeenCalled()); expect(screen.queryByRole("button", { name: "تعديل الصفحة" })).toBeNull(); });
  it("only enables channel editing after an owner explicitly opens it", async () => { mocks.user = { id: "owner" }; mocks.roles = [{ role: "admin" }]; mount(); fireEvent.click(await screen.findByRole("button", { name: "تعديل الصفحة" })); expect(screen.getByTestId("editing").textContent).toBe("editing"); fireEvent.click(screen.getByRole("button", { name: "إنهاء التعديل" })); expect(screen.getByTestId("editing").textContent).toBe("viewing"); });
  it("saves channel name, placement and visibility through existing owner writes", async () => { mocks.user = { id: "owner" }; mocks.roles = [{ role: "admin" }]; mocks.save.mockResolvedValue({ error: null }); mount(); fireEvent.click(await screen.findByRole("button", { name: "تعديل الصفحة" })); fireEvent.change(screen.getByLabelText("اسم القناة"), { target: { value: "قناتي" } }); fireEvent.change(screen.getByLabelText("القسم"), { target: { value: "رياضية" } }); fireEvent.click(screen.getByLabelText("إظهار القناة")); fireEvent.click(screen.getByRole("button", { name: "حفظ القناة" })); await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ channel_id: "one", name: "قناتي", category: "رياضية", hidden: true }, { onConflict: "channel_id" })); });
});