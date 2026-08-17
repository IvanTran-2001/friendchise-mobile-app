import type { QueryClient } from "@tanstack/react-query";
import { clearAuthToken } from "./token-store";

type LogoutRedirectArgs = {
  queryClient: QueryClient;
  setAuthenticated: (authenticated: boolean) => void;
  setDemoSession: (session: { isDemo: boolean; expiresAt: number | null }) => void;
  router: {
    replace: (path: string) => void;
  };
};

/**
 * Clears the current mobile session and returns the user to the login screen.
 */
export async function clearSessionAndRedirect({ queryClient, setAuthenticated, setDemoSession, router }: LogoutRedirectArgs) {
  try {
    await clearAuthToken();
  } finally {
    queryClient.clear();
    setAuthenticated(false);
    setDemoSession({ isDemo: false, expiresAt: null });
    router.replace("/(auth)/login");
  }
}