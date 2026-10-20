import { loadKind } from "./library.server";
export async function liveCatalogRows() {
  return Promise.all((await loadKind("live")).map(async (row) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`live:${row[3]}`));
    const id = `smarters:${Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("")}`;
    return { id, row };
  }));
}