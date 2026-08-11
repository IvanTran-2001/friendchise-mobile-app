import { Platform } from "react-native";
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
  const timeoutReason = createAbortReason("TimeoutError", "Request timed out.");
  const callerAbortReason = createAbortReason("AbortError", "Request was aborted by the caller.");
  const timeout = setTimeout(() => abortWithReason(controller, timeoutReason), timeoutMs);
  const abortListener = () => abortWithReason(controller, init.signal?.reason ?? callerAbortReason);

  if (init.signal) {
    if (init.signal.aborted) {
      abortWithReason(controller, init.signal.reason ?? callerAbortReason);
    } else {
      init.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: Platform.OS === "web" ? "include" : init.credentials,
      signal: controller.signal,
    });

    const body = response.status === 101 || response.status === 204 || response.status === 205 || response.status === 304
      ? null
      : await response.arrayBuffer();
    const bufferedResponse = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    try {
      Object.defineProperties(bufferedResponse, {
        url: { value: response.url },
        redirected: { value: response.redirected },
        type: { value: response.type },
      });
    } catch {
      // Some runtimes keep these properties read-only; the buffered response still works.
    }

    return bufferedResponse;
  } finally {
    clearTimeout(timeout);
    if (init.signal) {
      init.signal.removeEventListener("abort", abortListener);
    }
  }
}

function createAbortReason(name: "AbortError" | "TimeoutError", message: string) {
  if (typeof DOMException === "function") {
    return new DOMException(message, name);
  }

  const error = new Error(message);
  error.name = name;
  return error;
}

function abortWithReason(controller: AbortController, reason: unknown) {
  try {
    controller.abort(reason);
  } catch {
    controller.abort();
  }
}