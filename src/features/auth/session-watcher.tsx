import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { clearAuthToken, getAuthToken } from "./token-store";
import { useAuthStore } from "./auth-store";

export function SessionWatcher() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoExpiresAt = useAuthStore((state) => state.demoExpiresAt);
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
        setDemoSession({ isDemo: false, expiresAt: null });
        router.replace("/(auth)/login");
        return;
      }

      // The mobile token is an encrypted next-auth JWE, so we can't read its
      // exp/email claims client-side. isDemo/demoExpiresAt are set explicitly
      // at login (see callback.tsx) and persisted, so leave them untouched here.
      setAuthenticated(true);
    }).catch(() => {
      if (!alive) {
        return;
      }

      setAuthenticated(false);
      setDemoSession({ isDemo: false, expiresAt: null });
      router.replace("/(auth)/login");
    });

    return () => {
      alive = false;
    };
  }, [hasHydrated, router, setAuthenticated, setDemoSession]);

  useEffect(() => {
    if (!isDemo || !demoExpiresAt) {
      return;
    }

    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
    }

    expiryTimerRef.current = setTimeout(() => {
      const expire = async () => {
        try {
          await clearAuthToken();
        } finally {
          setAuthenticated(false);
          setDemoSession({ isDemo: false, expiresAt: null });
          router.replace("/(auth)/login");
        }
      };

      void expire();
    }, Math.max(0, demoExpiresAt - Date.now()));

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [demoExpiresAt, isDemo, router, setAuthenticated, setDemoSession]);

  return null;
}