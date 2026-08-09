import { getApiUrl } from "../config";
import { getAuthToken } from "../../features/auth/token-store";

/**
 * Performs an authenticated API request with shared headers and a timeout.
 */
export async function authenticatedFetch(path: string, init: RequestInit = {}, timeoutMs = 30000) {
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortListener = () => controller.abort();

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  try {
    return await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    if (init.signal) {
      init.signal.removeEventListener("abort", abortListener);
    }
  }
}