import { afterEach, describe, expect, it, vi } from "vitest";
import { speakWithFallback } from "@/lib/voice-config";

afterEach(() => vi.unstubAllGlobals());

describe("voice preview cancellation", () => {
  it("passes explicit cancellation to the speech provider without retrying", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url, options) => new Promise<Response>((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError")));
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = speakWithFallback("test-key", "Leda", "هلا", ["غني", "غني"], controller.signal);
    expect(fetchMock.mock.calls[0]?.[1].signal).toBe(controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});