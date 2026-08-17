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

  const token = useMemo(() => firstParam(params.token) ?? firstParam(params.access_token), [params.access_token, params.token]);
  const error = useMemo(() => firstParam(params.error), [params.error]);
  const isDemo = useMemo(() => firstParam(params.isDemo) === "1", [params.isDemo]);
  const expiresAt = useMemo(() => parseExpiresAt(params.expiresAt), [params.expiresAt]);

  useEffect(() => {
    if (error) {
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setDemoSession({ isDemo: false, expiresAt: null });
      router.replace("/(auth)/login");
      return;
    }

    if (!token) {
      return;
    }

    if (!expiresAt || expiresAt <= Date.now()) {
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setDemoSession({ isDemo: false, expiresAt: null });
      router.replace("/(auth)/login");
      return;
    }

    saveAuthToken(token)
      .then(() => {
        setAuthenticated(true);
        setSessionExpiresAt(expiresAt);
        setDemoSession({ isDemo, expiresAt: isDemo ? expiresAt : null });
        router.replace("/(app)");
      })
      .catch(() => {
        setAuthenticated(false);
        setSessionExpiresAt(null);
        setDemoSession({ isDemo: false, expiresAt: null });
        router.replace("/(auth)/login");
      });
  }, [error, expiresAt, isDemo, router, setAuthenticated, setDemoSession, setSessionExpiresAt, token]);

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