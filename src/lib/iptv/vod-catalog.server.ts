import { loadKind } from "./library.server";
import type { VodKind } from "./smarters-config";

export async function vodCatalogRows(kind: VodKind) {
  return Promise.all((await loadKind(kind)).map(async row => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${kind}:${row[3]}`));
    const id = `vod:${Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("")}`;
    return { id, row };
  }));
}