import { createHmac } from "crypto";

const KEY = "almoghani-iptv-relay-313285624258";
export const signRelay = (u: string) => createHmac("sha256", KEY).update(u).digest("hex").slice(0, 32);
export const relayUrl = (u: string) => `/api/public/iptv?u=${encodeURIComponent(u)}&s=${signRelay(u)}`;

/** Bare IPv4 hosts are rewritten to <ip>.sslip.io so the edge runtime can fetch them. */
export function fetchableUrl(u: URL): string {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return u.toString();
  const copy = new URL(u.toString());
  copy.hostname = `${u.hostname}.sslip.io`;
  return copy.toString();
}
