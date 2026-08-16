import type { QueryClient } from "@tanstack/react-query";
import { clearAuthToken } from "./token-store";

type LogoutRedirectArgs = {
  queryClient: QueryClient;
  setAuthenticated: (authenticated: boolean) => void;
  router: {
    replace: (path: string) => void;
  };
};

/**
 * Clears the current mobile session and returns the user to the login screen.
 */
export async function clearSessionAndRedirect({ queryClient, setAuthenticated, router }: LogoutRedirectArgs) {
  try {
    await clearAuthToken();
  } finally {
    queryClient.clear();
    setAuthenticated(false);
    router.replace("/(auth)/login");
  }
}