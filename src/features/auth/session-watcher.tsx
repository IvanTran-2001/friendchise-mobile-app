import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { clearAuthToken, getAuthToken } from "./token-store";
import { useAuthStore } from "./auth-store";

export function SessionWatcher() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setSessionExpiresAt = useAuthStore((state) => state.setSessionExpiresAt);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sessionExpiresAt = useAuthStore((state) => state.sessionExpiresAt);
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
        setSessionExpiresAt(null);
        setDemoSession({ isDemo: false, expiresAt: null });
        router.replace("/(auth)/login");
        return;
      }

      // The mobile token is an encrypted next-auth JWE, so we can't read its
      // claims client-side. The callback persists the session expiry metadata,
      // so we only sync auth state here.
      setAuthenticated(true);
    }).catch(() => {
      if (!alive) {
        return;
      }

      setAuthenticated(false);
      setSessionExpiresAt(null);
      setDemoSession({ isDemo: false, expiresAt: null });
      router.replace("/(auth)/login");
    });

    return () => {
      alive = false;
    };
  }, [hasHydrated, router, setAuthenticated, setDemoSession, setSessionExpiresAt]);

  useEffect(() => {
    if (!sessionExpiresAt) {
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
          setSessionExpiresAt(null);
          setDemoSession({ isDemo: false, expiresAt: null });
          router.replace("/(auth)/login");
        }
      };

      void expire();
    }, Math.max(0, sessionExpiresAt - Date.now()));

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [router, sessionExpiresAt, setAuthenticated, setDemoSession, setSessionExpiresAt]);

  return null;
}