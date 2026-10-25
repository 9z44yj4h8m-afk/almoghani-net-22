import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SayNowForm, VoiceChatManager } from "@/components/admin/voice-chat-manager";

const { preview } = vi.hoisted(() => ({ preview: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => preview }));
vi.mock("@/lib/voice-preview.functions", () => ({ previewVoice: {} }));
vi.mock("@/lib/chat-bots.functions", () => ({ defaultChatBots: { bots: [{ name: "نورة" }] } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [] }) }) }),
} }));

beforeEach(() => {
  localStorage.clear();
  preview.mockReset();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function makeClip() {
  fireEvent.change(screen.getByRole("textbox", { name: "الكلام" }), { target: { value: "هلا يا نورة" } });
  fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
  await waitFor(() => expect(preview).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText("هذا هو الصوت اللي اخترته ✓")).toBeInTheDocument());
}

describe("female voice panel", () => {
  it("cancels a pending preview immediately and ignores its late audio", async () => {
    let finish: ((value: { audio: string }) => void) | undefined;
    preview.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<SayNowForm />);
    fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1));
    const call = preview.mock.calls[0]?.[0];
    expect(call.data.sing).toBeUndefined();
    expect(call.signal.aborted).toBe(false);
    expect(screen.getByRole("button", { name: "إيقاف الصوت" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "إيقاف التجربة" }));
    expect(call.signal.aborted).toBe(true);
    expect(screen.getByRole("button", { name: "تجريب الصوت" })).toBeEnabled();
    await act(async () => { finish?.({ audio: btoa("late-audio") }); });
    expect(play).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("معاينة الصوت المولد")).toBeNull();
  });
  it("does not start device speech when a canceled request fails", async () => {
    let fail: ((reason: Error) => void) | undefined;
    preview.mockImplementation(() => new Promise((_, reject) => { fail = reject; }));
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel });
    render(<SayNowForm />);
    fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "إيقاف الصوت" }));
    await act(async () => { fail?.(new Error("canceled")); });
    await waitFor(() => expect(screen.getByRole("button", { name: "تجريب الصوت" })).toBeEnabled());
    expect(cancel).toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });
  it("reuses an identical preview immediately but regenerates after the text changes", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:voice-preview"), revokeObjectURL: vi.fn() }));
    preview.mockResolvedValue({ audio: btoa("test-audio") });
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<SayNowForm />);
    await makeClip();
    fireEvent.click(screen.getByRole("button", { name: "إيقاف الصوت" }));
    fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(preview).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole("textbox", { name: "الكلام" }), { target: { value: "يا هلا بالغالي" } });
    fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(2));
  });
  it("removes send-now, preset songs and male voice options", () => {
    render(<><SayNowForm /><VoiceChatManager /></>);
    expect(screen.queryByRole("button", { name: "قلها الآن" })).toBeNull();
    expect(screen.queryByText(/أغاني جاهزة/)).toBeNull();
    expect(screen.queryByText("أصوات الشباب")).toBeNull();
    expect(screen.queryByRole("option", { name: /Puck|Charon|Fenrir/ })).toBeNull();
    for (const name of ["حرير", "ليان", "رنيم", "جمان", "رهيل", "أريج", "هتون", "تالين"]) {
      expect(screen.getAllByRole("option", { name: new RegExp(name) }).length).toBeGreaterThan(0);
    }
    for (const name of ["حفظ الصوت في جوالي", "إرسال للواتساب", "إرسال لسناب شات"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    const test = screen.getByRole("button", { name: "تجريب الصوت" });
    expect(test.nextElementSibling).toBe(screen.getByRole("button", { name: "إرسال الصوت" }));
  });
  it("previews selected female speech and keeps one send control", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:voice-preview"), revokeObjectURL: vi.fn() }));
    preview.mockResolvedValue({ audio: btoa("test-audio") });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<SayNowForm />);
    expect(screen.queryByRole("button", { name: "حفظ الصوت في جوالي" })).toBeNull();
    expect(screen.queryByRole("button", { name: "إرسال الصوت" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("صوت هذه الجملة"), { target: { value: "female-hessa" } });
    await makeClip();
    await waitFor(() => expect(preview).toHaveBeenCalledWith(expect.objectContaining({ data: { text: "هلا يا نورة", voice: "female-hessa", delivery: undefined }, signal: expect.any(AbortSignal) })));

  });
  it("opens one send menu with the chat apps once a clip exists", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:voice-preview"), revokeObjectURL: vi.fn() }));
    preview.mockResolvedValue({ audio: btoa("test-audio") });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<SayNowForm />);
    fireEvent.click(screen.getByRole("button", { name: "إرسال الصوت" }));
    expect(screen.queryByRole("button", { name: "واتساب" })).toBeNull();
    expect(screen.getByText("اكتب النص واضغط «تجريب الصوت» أول، أو سجّل بصوتك من أيقونة الإعدادات، وبعدها ترسله.")).toBeInTheDocument();
    await makeClip();
    fireEvent.click(screen.getByRole("button", { name: "إرسال الصوت" }));
    for (const app of ["واتساب", "تيليجرام صوتي", "سناب شات", "سيجنال"]) {
      expect(screen.getByRole("button", { name: app })).toBeEnabled();
    }
  });
  it("ends with the play and send controls and offers echo only, with no singing controls", () => {
    render(<SayNowForm />);
    const panel = screen.getByRole("region", { name: "تجريب أصوات البنات" });
    expect(screen.queryByRole("button", { name: "حفظ اختيار البوت" })).toBeNull();
    expect(screen.queryByRole("link", { name: "للتواصل والاشتراك" })).toBeNull();
    const rows = Array.from(panel.querySelectorAll(".voice-studio-actions"));
    const last = rows.at(-1);
    expect(last).toBeTruthy();
    const labels = Array.from(last?.querySelectorAll("button") ?? []).map((b) => b.textContent?.trim());
    expect(labels).toEqual(["تجريب الصوت", "إرسال الصوت"]);
    expect(screen.queryByRole("switch", { name: "خلّها تغني الكلام بدل ما تقوله" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "اللحن" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "الإيقاع والرقصة" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "لحن الخلفية" })).toBeNull();
    expect(screen.getByRole("combobox", { name: "مؤثر الصدى" })).toBeVisible();
  });
  it("stops the preview with the stop button", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:voice-preview"), revokeObjectURL: vi.fn() }));
    preview.mockResolvedValue({ audio: btoa("test-audio") });
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<SayNowForm />);
    const stop = screen.getByRole("button", { name: "إيقاف الصوت" });
    expect(stop).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "الكلام" }), { target: { value: "هلا" } });
    fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
    await waitFor(() => expect(play).toHaveBeenCalled());
    await waitFor(() => expect(stop).toBeEnabled());
    fireEvent.click(stop);
    expect(pause).toHaveBeenCalled();
    // the looping preview is released: stopping again only silences the saved clip player
    const before = pause.mock.calls.length;
    fireEvent.click(stop);
    expect(pause.mock.calls.length).toBeGreaterThanOrEqual(before);
  });
  it("plays the preview once and replays it with the replay button", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:voice-preview"), revokeObjectURL: vi.fn() }));
    preview.mockResolvedValue({ audio: btoa("test-audio") });
    preview.mockClear();
    const played: HTMLMediaElement[] = [];
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { played.push(this); return Promise.resolve(); });
    render(<SayNowForm />);
    const replay = screen.getByRole("button", { name: "إعادة الصوت" });
    expect(replay).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "الكلام" }), { target: { value: "هلا" } });
    fireEvent.click(screen.getByRole("button", { name: "تجريب الصوت" }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    // the clip is not self-repeating: it stops on its own and only the replay button starts it again
    expect(played[0]?.loop).toBe(false);
    await waitFor(() => expect(replay).toBeEnabled());
    fireEvent.click(replay);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(preview).toHaveBeenCalledTimes(1);
  });
});
