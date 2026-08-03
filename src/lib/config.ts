export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return configured;
  }

  throw new Error("EXPO_PUBLIC_API_URL must be set for this app to reach the backend.");
}