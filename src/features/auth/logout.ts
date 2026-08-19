import type { QueryClient } from "@tanstack/react-query";
import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
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
    const callbackUrl = ExpoLinking.createURL("/login");
    const signOutUrl = `${getApiUrl()}/api/mobile-auth/logout?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    try {
      await WebBrowser.openAuthSessionAsync(signOutUrl, callbackUrl);
    } catch {
      // If the browser sign-out flow is interrupted, still clear the local session.
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