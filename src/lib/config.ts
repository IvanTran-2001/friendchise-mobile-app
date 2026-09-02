export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    let parsed: URL;

    try {
      parsed = new URL(configured.replace(/\/+$/, ""));
    } catch {
      throw new Error(
        "EXPO_PUBLIC_API_URL must be a valid HTTPS URL. Use a secure backend URL when testing on a device; http:// and malformed values are rejected.",
      );
    }

    const isDevLocalhost =
      __DEV__ &&
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

    if (parsed.protocol !== "https:" && !isDevLocalhost) {
      throw new Error(
        "EXPO_PUBLIC_API_URL must be a valid HTTPS URL. Use a secure backend URL when testing on a device; http:// and malformed values are rejected.",
      );
    }

    return configured.replace(/\/+$/, "");
  }

  throw new Error(
    "EXPO_PUBLIC_API_URL must be set for this app to reach the backend. Use your machine's LAN IP or a public backend URL when testing on a device; localhost only works when the app and backend share the same host.",
  );
}