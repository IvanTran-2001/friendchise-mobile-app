import type { QueryClient } from "@tanstack/react-query";
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
    await clearAuthToken();
  } finally {
    queryClient.clear();
    setAuthenticated(false);
    setSessionExpiresAt(null);
    setDemoSession({ isDemo: false, expiresAt: null });
    router.replace("/(auth)/login");
  }
}