import type { QueryClient } from "@tanstack/react-query";
import * as ExpoLinking from "expo-linking";
import { Linking, Platform } from "react-native";
import { getApiUrl } from "../../lib/config";
import { clearAuthToken } from "./token-store";

type LogoutRedirectArgs = {
  queryClient: QueryClient;
  setAuthenticated: (authenticated: boolean) => void;
  setSessionExpiresAt: (expiresAt: number | null) => void;
  setDemoSession: (session: { isDemo: boolean; expiresAt: number | null }) => void;
  router: {
    replace: (path: string) => void;
  };
};

/**
 * Clears the current mobile session and returns the user to the login screen.
 */
export async function clearSessionAndRedirect({ queryClient, setAuthenticated, setSessionExpiresAt, setDemoSession, router }: LogoutRedirectArgs) {
  try {
    if (Platform.OS !== "web") {
      const callbackUrl = ExpoLinking.createURL("/login");
      const signOutUrl = `${getApiUrl()}/api/mobile-auth/signout?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      await Linking.openURL(signOutUrl);
    }
    await clearAuthToken();
  } finally {
    queryClient.clear();
    setAuthenticated(false);
    setSessionExpiresAt(null);
    setDemoSession({ isDemo: false, expiresAt: null });
    router.replace("/(auth)/login");
  }
}