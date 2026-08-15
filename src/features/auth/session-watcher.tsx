import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { clearAuthToken, getAuthToken } from "./token-store";
import { getJwtExpiryMs, isJwtExpired } from "./jwt-utils";
import { useAuthStore } from "./auth-store";

export function SessionWatcher() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let alive = true;

    getAuthToken().then((token) => {
      if (!alive) {
        return;
      }

      if (!token) {
        setAuthenticated(false);
        router.replace("/(auth)/login");
        return;
      }

      if (isJwtExpired(token)) {
        void clearAuthToken();
        setAuthenticated(false);
        router.replace("/(auth)/login");
        return;
      }

      setAuthenticated(true);

      const expiryMs = getJwtExpiryMs(token);
      if (!expiryMs) {
        return;
      }

      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }

      expiryTimerRef.current = setTimeout(() => {
        void clearAuthToken();
        setAuthenticated(false);
        router.replace("/(auth)/login");
      }, Math.max(0, expiryMs - Date.now()));
    }).catch(() => {
      if (!alive) {
        return;
      }

      setAuthenticated(false);
      router.replace("/(auth)/login");
    });

    return () => {
      alive = false;
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [hasHydrated, router, setAuthenticated]);

  return null;
}