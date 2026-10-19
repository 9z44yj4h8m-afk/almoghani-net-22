import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (handler: unknown) => handler,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

import { getMemberAccess } from "@/lib/member.functions";

const invokeAccess = getMemberAccess as unknown as (args: { context: { userId: string; supabase: unknown } }) => Promise<{ unlocked: boolean }>;

describe("PIN-free authenticated library session", () => {
  it("opens the member's session without supplying PIN 0550", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const query = { select: () => query, eq: () => query, maybeSingle: vi.fn() };
    query.maybeSingle.mockResolvedValueOnce({ data: { display_name: "عضو" }, error: null })
      .mockResolvedValueOnce({ data: { unlocked: true, entered_at: "2026-10-19" }, error: null });
    const result = await invokeAccess({ context: { userId: "member", supabase: { rpc, from: () => query } } });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("open_member_library_session");
    expect(result.unlocked).toBe(true);
  });

  it("rejects members denied by the session opener before reading private session data", async () => {
    const from = vi.fn();
    await expect(invokeAccess({ context: { userId: "member", supabase: { rpc: vi.fn().mockResolvedValue({ data: false, error: null }), from } } })).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });
});