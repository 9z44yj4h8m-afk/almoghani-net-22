import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PRIVATE_PIN } from "../private-movies.server";

const kind = z.enum(["live", "movie", "series"]);
const pin = z.string().regex(/^\d{1,8}$/);

function check(p: string) {
  if (p !== PRIVATE_PIN) throw new Error("رقم سري خاطئ");
}

export const getLibraryGroups = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ pin, kind }).parse(d))
  .handler(async ({ data }) => {
    check(data.pin);
    const { groupsOf } = await import("./library.server");
    return groupsOf(data.kind);
  });

export const searchLibrary = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ pin, kind, q: z.string().max(100), group: z.string().max(200), page: z.number().int().min(0).max(5000) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    check(data.pin);
    const { search } = await import("./library.server");
    return search(data.kind, data.q, data.group, data.page);
  });
