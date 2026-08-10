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
  const timeoutReason = new DOMException("Request timed out.", "TimeoutError");
  const callerAbortReason = new DOMException("Request was aborted by the caller.", "AbortError");
  const timeout = setTimeout(() => controller.abort(timeoutReason), timeoutMs);
  const abortListener = () => controller.abort(init.signal?.reason ?? callerAbortReason);

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort(init.signal.reason ?? callerAbortReason);
    } else {
      init.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    const body = await response.clone().arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    clearTimeout(timeout);
    if (init.signal) {
      init.signal.removeEventListener("abort", abortListener);
    }
  }
}