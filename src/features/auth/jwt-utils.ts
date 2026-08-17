export function isJwtExpired(sessionExpiresAt: number | null, nowMs = Date.now()) {
  if (!sessionExpiresAt) {
    return false;
  }

  return sessionExpiresAt <= nowMs;
}