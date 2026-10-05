import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PRIVATE_PIN, privateMovies } from "./private-movies.server";

export const unlockPrivateMovies = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ pin: z.string().regex(/^\d{1,8}$/) }).parse(d))
  .handler(async ({ data }) => {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    if (data.pin !== PRIVATE_PIN) return { ok: false as const, movies: [] };
    return { ok: true as const, movies: privateMovies };
  });
