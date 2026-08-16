function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string) {
  const exp = decodeJwtPayload(token)?.exp;

  if (typeof exp !== "number") {
    return null;
  }

  return exp * 1000;
}

export function isJwtExpired(token: string, nowMs = Date.now()) {
  const expiryMs = getJwtExpiryMs(token);

  if (!expiryMs) {
    return false;
  }

  return expiryMs <= nowMs;
}

/** Reads the token's `email` claim, e.g. to detect demo sessions client-side. */
export function getJwtEmail(token: string): string | null {
  const email = decodeJwtPayload(token)?.email;

  return typeof email === "string" ? email : null;
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  return decodeBase64(padded);
}

function decodeBase64(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of value) {
    if (char === "=") {
      break;
    }

    const index = alphabet.indexOf(char);
    if (index < 0) {
      continue;
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}