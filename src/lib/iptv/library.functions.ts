import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PRIVATE_PIN } from "../private-movies.server";

const kind = z.enum(["live", "movie", "series"]);
const pin = z.string().max(200);
const TRIAL_MS = 60_000;

async function sign(exp: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("trial:" + PRIVATE_PIN), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(exp));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function check(p: string) {
  if (p === PRIVATE_PIN) return;
  if (p.startsWith("t.")) {
    const [, exp, sig] = p.split(".");
    if (exp && sig && Number(exp) > Date.now() && (await sign(exp)) === sig) return;
    throw new Error("انتهت فترة المعاينة");
  }
  throw new Error("رقم سري خاطئ");
}

export const startTrial = createServerFn({ method: "POST" }).handler(async () => {
  const exp = String(Date.now() + TRIAL_MS);
  return { token: `t.${exp}.${await sign(exp)}`, expiresAt: Number(exp) };
});

export const getLibraryGroups = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ pin, kind }).parse(d))
  .handler(async ({ data }) => {
    await check(data.pin);
    const { groupsOf } = await import("./library.server");
    return groupsOf(data.kind);
  });

export const getLibraryTitles = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ pin, kind: z.enum(["live", "series"]), q: z.string().max(100), page: z.number().int().min(0).max(5000) }).parse(d),
  )
  .handler(async ({ data }) => {
    await check(data.pin);
    const { titles } = await import("./library.server");
    return titles(data.kind, data.q, data.page);
  });

export const searchLibrary = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ pin, kind, q: z.string().max(100), group: z.string().max(200), page: z.number().int().min(0).max(5000) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await check(data.pin);
    const { search } = await import("./library.server");
    return search(data.kind, data.q, data.group, data.page);
  });
