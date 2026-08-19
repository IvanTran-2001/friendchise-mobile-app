import { useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { saveAuthToken } from "./token-store";
import { useAuthStore } from "./auth-store";

type AuthCallbackQuery = {
  token?: string | string[];
  access_token?: string | string[];
  error?: string | string[];
  isDemo?: string | string[];
  expiresAt?: string | string[];
  attemptId?: string | string[];
};

type AuthCallbackState = {
  message: string;
  hasError: boolean;
  showRecoveryAction: boolean;
  recoveryLabel: string;
  recover: () => void;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseExpiresAt(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useAuthCallbackState(): AuthCallbackState {
  const router = useRouter();
  const params = useLocalSearchParams<AuthCallbackQuery>();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setSessionExpiresAt = useAuthStore((state) => state.setSessionExpiresAt);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);
  const activeOAuthAttemptId = useAuthStore((state) => state.activeOAuthAttemptId);
  const clearActiveOAuthAttemptId = useAuthStore((state) => state.clearActiveOAuthAttemptId);

  const token = useMemo(() => firstParam(params.token) ?? firstParam(params.access_token), [params.access_token, params.token]);
  const error = useMemo(() => firstParam(params.error), [params.error]);
  const isDemo = useMemo(() => firstParam(params.isDemo) === "1", [params.isDemo]);
  const expiresAt = useMemo(() => parseExpiresAt(params.expiresAt), [params.expiresAt]);
  const attemptId = useMemo(() => firstParam(params.attemptId), [params.attemptId]);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const attemptMatches = !!attemptId && (!activeOAuthAttemptId || activeOAuthAttemptId === attemptId);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    const logPrefix = attemptId ? `[AUTH ${attemptId}][MOBILE]` : "[AUTH unknown][MOBILE]";
    console.info(`${logPrefix} callback received`, {
      route: "/(auth)/callback",
      nativeAuthStatus: isAuthenticated,
      tokenPresent: !!token,
      error: error ?? null,
      isDemo,
      expiresAt,
      attemptMatches,
    });
  }, [attemptId, attemptMatches, error, expiresAt, isAuthenticated, isDemo, token]);

  useEffect(() => {
    if (error) {
      if (__DEV__) {
        console.info("[mobile-auth] callback error branch", { error });
      }
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setDemoSession({ isDemo: false, expiresAt: null });
      clearActiveOAuthAttemptId();
      router.replace("/(auth)/login");
      return;
    }

    if (!attemptMatches) {
      if (__DEV__) {
        console.info("[mobile-auth] callback attempt mismatch", {
          activeOAuthAttemptId,
          attemptId: attemptId ?? null,
        });
      }
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setDemoSession({ isDemo: false, expiresAt: null });
      clearActiveOAuthAttemptId();
      router.replace("/(auth)/login");
      return;
    }

    if (!token) {
      if (__DEV__) {
        console.info("[mobile-auth] callback waiting for token");
      }
      return;
    }

    if (!expiresAt || expiresAt <= Date.now()) {
      if (__DEV__) {
        console.info("[mobile-auth] callback expired or invalid expiry", { expiresAt });
      }
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setDemoSession({ isDemo: false, expiresAt: null });
      clearActiveOAuthAttemptId();
      router.replace("/(auth)/login");
      return;
    }

    if (__DEV__) {
      console.info("[mobile-auth] saving callback token", { expiresAt, isDemo });
    }

    saveAuthToken(token)
      .then(() => {
        if (__DEV__) {
          console.info("[mobile-auth] callback token saved, redirecting to app", { expiresAt, isDemo });
        }
        setAuthenticated(true);
        setSessionExpiresAt(expiresAt);
        setDemoSession({ isDemo, expiresAt: isDemo ? expiresAt : null });
        clearActiveOAuthAttemptId();
        router.replace("/(app)");
      })
      .catch(() => {
        if (__DEV__) {
          console.info("[mobile-auth] failed to save callback token");
        }
        setAuthenticated(false);
        setSessionExpiresAt(null);
        setDemoSession({ isDemo: false, expiresAt: null });
        clearActiveOAuthAttemptId();
        router.replace("/(auth)/login");
      });
  }, [
    activeOAuthAttemptId,
    attemptId,
    attemptMatches,
    clearActiveOAuthAttemptId,
    error,
    expiresAt,
    isDemo,
    router,
    setAuthenticated,
    setDemoSession,
    setSessionExpiresAt,
    token,
  ]);

  const recover = useMemo(() => () => router.replace("/(auth)/login"), [router]);

  const message = error
    ? `Sign in failed: ${error}`
    : token
      ? "Completing sign in..."
      : "Waiting for the backend to return a token...";

  return {
    message,
    hasError: !!error,
    showRecoveryAction: !!error || !token,
    recoveryLabel: error ? "Back to sign in" : "Cancel sign in",
    recover,
  };
}