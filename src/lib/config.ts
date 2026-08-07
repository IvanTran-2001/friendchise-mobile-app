export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return configured;
  }

  throw new Error(
    "EXPO_PUBLIC_API_URL must be set for this app to reach the backend. Use your machine's LAN IP or a public backend URL when testing on a device; localhost only works when the app and backend share the same host.",
  );
}