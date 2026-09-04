import Constants from "expo-constants";

type ExpoExtraConfig = {
  apiUrl?: string;
  allowHttpAuth?: boolean;
};

function getExpoExtraConfig() {
  return (Constants.expoConfig?.extra ?? {}) as ExpoExtraConfig;
}

// Matches loopback and private LAN ranges (10.x, 172.16-31.x, 192.168.x) used for on-device dev testing.
function isDevHttpHostname(hostname: string) {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  const privateLanPattern = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;
  return privateLanPattern.test(hostname);
}

export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim() || getExpoExtraConfig().apiUrl?.trim();
  if (configured) {
    let parsed: URL;

    try {
      parsed = new URL(configured.replace(/\/+$/, ""));
    } catch {
      throw new Error(
        "EXPO_PUBLIC_API_URL must be a valid HTTPS URL. Use a secure backend URL when testing on a device; http:// and malformed values are rejected.",
      );
    }

    const isDevLocalhost = __DEV__ && parsed.protocol === "http:" && isDevHttpHostname(parsed.hostname);

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

export function shouldSendAuthHeaderToApi(baseUrl: string) {
  try {
    const parsed = new URL(baseUrl);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}