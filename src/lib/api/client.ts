import { getApiUrl } from "../config";
import { shouldSendAuthHeaderToApi } from "../config";
import { getAuthToken } from "../../features/auth/token-store";
import { Platform } from "react-native";

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = await getAuthToken();

  if (token && shouldSendAuthHeaderToApi(baseUrl)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: Platform.OS === "web" ? "include" : init.credentials,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}