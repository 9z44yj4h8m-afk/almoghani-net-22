import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SmartersPlayer } from "@/components/smarters-player";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Smarters playback failure and retry", () => {
  it("reports media errors and retries the same protected playback endpoint", () => {
    render(<SmartersPlayer url="https://example.test/movie/sample.mp4" />);
    const video = screen.getByLabelText("مشغّل سمارتر") as HTMLVideoElement;
    const source = video.getAttribute("src");
    expect(source).toBe("/api/public/iptv?u=https%3A%2F%2Fexample.test%2Fmovie%2Fsample.mp4");
    fireEvent.error(video);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(video.getAttribute("src")).toBe(source);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });
  it("clears the failure when actual playback resumes", () => {
    render(<SmartersPlayer url="https://example.test/movie/sample.mp4" />);
    const video = screen.getByLabelText("مشغّل سمارتر");
    fireEvent.error(video);
    fireEvent.playing(video);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});