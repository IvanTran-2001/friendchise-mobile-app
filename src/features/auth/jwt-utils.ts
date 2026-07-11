export function getJwtExpiryMs(token: string) {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const exp = payload?.exp;

    if (typeof exp !== "number") {
      return null;
    }

    return exp * 1000;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, nowMs = Date.now()) {
  const expiryMs = getJwtExpiryMs(token);

  if (!expiryMs) {
    return true;
  }

  return expiryMs <= nowMs;
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  throw new Error("Base64 decoder unavailable");
}