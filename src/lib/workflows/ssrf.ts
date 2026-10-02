/**
 * SSRF protection for the HTTP Request node.
 *
 * Blocks requests to private, loopback, link-local and reserved address ranges,
 * and non-http(s) schemes, so workflows cannot be used to reach internal network
 * services or cloud metadata endpoints.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

function ipv4IsPrivate(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function ipv6IsPrivate(ip: string): boolean {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (addr === "::1" || addr === "::") return true;
  if (addr.startsWith("fe80")) return true; // link-local
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // unique local
  if (addr.startsWith("::ffff:")) return ipv4IsPrivate(addr.replace("::ffff:", "")); // mapped v4
  return false;
}

function addressIsBlocked(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return ipv4IsPrivate(ip);
  if (kind === 6) return ipv6IsPrivate(ip);
  return true;
}

/**
 * Validate a URL for outbound requests. Throws {@link SsrfBlockedError} when the
 * target resolves to a disallowed address or uses a disallowed scheme.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError(`Invalid URL: ${rawUrl}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError(`Blocked scheme "${url.protocol}". Only http and https are allowed.`);
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new SsrfBlockedError(`Blocked host "${host}" (internal/loopback).`);
  }

  // If the host is a literal IP, check it directly; otherwise resolve it.
  if (isIP(host)) {
    if (addressIsBlocked(host)) {
      throw new SsrfBlockedError(`Blocked request to private/reserved address ${host}.`);
    }
    return url;
  }

  try {
    const results = await lookup(host, { all: true });
    for (const { address } of results) {
      if (addressIsBlocked(address)) {
        throw new SsrfBlockedError(`Host "${host}" resolves to blocked address ${address}.`);
      }
    }
  } catch (err) {
    if (err instanceof SsrfBlockedError) throw err;
    throw new SsrfBlockedError(`Unable to resolve host "${host}" for safety validation.`);
  }

  return url;
}
