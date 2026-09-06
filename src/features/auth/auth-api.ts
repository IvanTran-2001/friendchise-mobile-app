import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { Platform } from "react-native";
import type { AppleAuthenticationCredential } from "expo-apple-authentication";
import { getApiUrl } from "../../lib/config";
import { useAuthStore } from "./auth-store";
import { saveAuthToken } from "./token-store";

export type AuthProvider = "apple" | "google" | "linkedin";

export type DevUser = {
  email: string;
  label: string;
  role: string;
};

type DevLoginResponse = {
  token: string;
};

type NativeAppleLoginResponse = {
  token: string;
  expiresAt: number;
  attemptId?: string;
};

function isNativeAppleLoginResponse(value: unknown): value is NativeAppleLoginResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    typeof candidate.expiresAt === "number" &&
    Number.isFinite(candidate.expiresAt)
  );
}

function shouldLogAuthFlow() {
  return __DEV__;
}

function generateAttemptId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `attempt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Strips the token value before logging a callback URL so we never print credentials.
function redactCallbackUrl(url: string) {
  try {
    const parsed = new URL(url.replace(/^([a-z][a-z0-9+.-]*):\/\//i, "https://"));
    if (parsed.searchParams.has("token")) {
      parsed.searchParams.set("token", "<redacted>");
    }
    if (parsed.searchParams.has("access_token")) {
      parsed.searchParams.set("access_token", "<redacted>");
    }
    return parsed.pathname + "?" + parsed.searchParams.toString();
  } catch {
    return "<unparseable>";
  }
}

function formatAppleDisplayName(fullName?: AppleAuthenticationCredential["fullName"] | null) {
  if (!fullName) {
    return null;
  }

  const parts = [fullName.givenName, fullName.middleName, fullName.familyName]
    .map((part) => part?.trim())
    .filter((part): part is string => !!part);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  const nickname = fullName.nickname?.trim();
  return nickname || null;
}

function isAppleCancellationError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code.includes("CANCEL") || error.message.toLowerCase().includes("cancel");
}

async function getResponseError(response: Response) {
  const body = await response.text();
  return body || response.statusText || `HTTP ${response.status}`;
}

// Diagnostic only — detects whether a second OAuth transaction starts before
// the first one resolved. Not a fix; do not turn this into a silent no-op.
let activeOAuthAttemptId: string | null = null;

type DemoLoginResponse = {
  token: string;
  orgId: string;
  isDemo: true;
  expiresAt: number;
};

function isDemoLoginResponse(value: unknown): value is DemoLoginResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    typeof candidate.expiresAt === "number" &&
    Number.isFinite(candidate.expiresAt) &&
    candidate.isDemo === true
  );
}

export async function fetchDevUsers() {
  const response = await fetch(`${getApiUrl()}/api/mobile-auth/dev-users`);

  if (!response.ok) {
    throw new Error(`Failed to load dev users: ${await getResponseError(response)}`);
  }

  return (await response.json()) as DevUser[];
}

export async function startOAuthLogin(provider: AuthProvider) {
  const attemptId = generateAttemptId();
  const logPrefix = `[AUTH ${attemptId}][MOBILE]`;
  const { setActiveOAuthAttemptId, clearActiveOAuthAttemptId } = useAuthStore.getState();
  let handedOffToCallback = false;

  if (activeOAuthAttemptId && shouldLogAuthFlow()) {
    console.warn(`${logPrefix} another OAuth attempt is already active`, {
      activeOAuthAttemptId,
    });
  }
  activeOAuthAttemptId = attemptId;
  setActiveOAuthAttemptId(attemptId);

  const callbackUrl = `${ExpoLinking.createURL("/callback")}?attemptId=${encodeURIComponent(attemptId)}`;
  const completeUrl = `/api/mobile-auth/complete?callbackUrl=${encodeURIComponent(callbackUrl)}&attemptId=${encodeURIComponent(attemptId)}`;
  // Not /api/auth/signin/[provider] directly — Auth.js requires a CSRF-tokened
  // POST there, which a plain browser GET can't provide (fails with
  // error=Configuration). This mobile-only route calls signIn() internally instead.
  const url = `${getApiUrl()}/api/mobile-auth/oauth-start/${provider}?callbackUrl=${encodeURIComponent(completeUrl)}&attemptId=${encodeURIComponent(attemptId)}`;

  if (shouldLogAuthFlow()) {
    console.info(`${logPrefix} login started`, {
      provider,
      route: "/(auth)/login",
    });
    console.info(`${logPrefix} authUrl`, { authUrl: url });
    console.info(`${logPrefix} redirectUri`, { redirectUri: callbackUrl });
  }

  try {
    // ASWebAuthenticationSession (via openAuthSessionAsync), not a plain browser
    // tab (Linking.openURL). A full Safari tab can lose the "user activated"
    // state across Google's multi-hop redirect chain, so the final redirect to
    // our friendchise:// scheme sometimes lands as a rendered page instead of
    // handing control back to the app. openAuthSessionAsync intercepts the
    // matching redirect at the OS level and never renders the destination.
    if (shouldLogAuthFlow()) {
      console.info(`[AUTH ${attemptId}][WEBBROWSER] opened`);
    }
    const result = await WebBrowser.openAuthSessionAsync(url, callbackUrl);

    if (shouldLogAuthFlow()) {
      console.info(`[AUTH ${attemptId}][WEBBROWSER] result.type`, { type: result.type });
      console.info(`[AUTH ${attemptId}][WEBBROWSER] result.url`, {
        url: result.type === "success" ? redactCallbackUrl(result.url) : null,
      });
    }

    // ASWebAuthenticationSession does NOT redeliver the matched redirect through
    // Linking — Expo's own docs say a Linking listener "is not needed and can
    // have side effects" here. The result is only available on `result.url`, so
    // without this the sheet closes but the app never processes the token.
    if (result.type === "success" && result.url) {
      const { queryParams } = ExpoLinking.parse(result.url);
      if (shouldLogAuthFlow()) {
        console.info(`${logPrefix} deep link received`, {
          attemptIdEcho: queryParams?.attemptId ?? null,
        });
      }
      handedOffToCallback = true;
      router.replace({ pathname: "/callback", params: queryParams ?? undefined });
    } else {
      if (useAuthStore.getState().activeOAuthAttemptId === attemptId) {
        clearActiveOAuthAttemptId();
      }
    }
  } finally {
    if (activeOAuthAttemptId === attemptId) {
      activeOAuthAttemptId = null;
    }

    if (!handedOffToCallback && useAuthStore.getState().activeOAuthAttemptId === attemptId) {
      clearActiveOAuthAttemptId();
    }
  }
}

export async function startAppleLogin() {
  if (Platform.OS !== "ios") {
    await startOAuthLogin("apple");
    return;
  }

  const attemptId = generateAttemptId();
  const logPrefix = `[AUTH ${attemptId}][MOBILE]`;
  const { setActiveOAuthAttemptId, clearActiveOAuthAttemptId } = useAuthStore.getState();
  setActiveOAuthAttemptId(attemptId);

  try {
    const appleAuthentication = await import("expo-apple-authentication");
    const available = await appleAuthentication.isAvailableAsync();

    if (!available) {
      await startOAuthLogin("apple");
      return;
    }

    if (shouldLogAuthFlow()) {
      console.info(`${logPrefix} native Apple sign-in started`, { route: "/(auth)/login" });
    }

    const credential = (await appleAuthentication.signInAsync({
      requestedScopes: [
        appleAuthentication.AppleAuthenticationScope.FULL_NAME,
        appleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })) as AppleAuthenticationCredential;

    const apiUrl = getApiUrl();
    if (new URL(apiUrl).protocol !== "https:") {
      throw new Error("Apple sign in requires an HTTPS backend URL.");
    }

    const identityToken = credential.identityToken?.trim();
    if (!identityToken) {
      throw new Error("Apple did not return an identity token");
    }

    const response = await fetch(`${apiUrl}/api/mobile-auth/apple`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken,
        authorizationCode: credential.authorizationCode ?? undefined,
        email: credential.email ?? undefined,
        displayName: formatAppleDisplayName(credential.fullName),
        attemptId,
      }),
    });

    if (shouldLogAuthFlow()) {
      console.info(`${logPrefix} native Apple response`, {
        ok: response.ok,
        status: response.status,
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to complete Apple sign in: ${await getResponseError(response)}`);
    }

    const rawBody: unknown = await response.json();
    if (!isNativeAppleLoginResponse(rawBody)) {
      throw new Error("Apple login response was malformed");
    }
    const body = rawBody;

    if (useAuthStore.getState().activeOAuthAttemptId !== attemptId) {
      return;
    }

    await saveAuthToken(body.token);

    if (useAuthStore.getState().activeOAuthAttemptId !== attemptId) {
      return;
    }

    useAuthStore.getState().setAuthenticated(true);
    useAuthStore.getState().setSessionExpiresAt(body.expiresAt);
    useAuthStore.getState().setDemoSession({ isDemo: false, expiresAt: null });
    clearActiveOAuthAttemptId();
    router.replace("/(app)");
  } catch (error) {
    if (isAppleCancellationError(error)) {
      if (useAuthStore.getState().activeOAuthAttemptId === attemptId) {
        clearActiveOAuthAttemptId();
      }
      return;
    }

    if (useAuthStore.getState().activeOAuthAttemptId === attemptId) {
      clearActiveOAuthAttemptId();
    }
    throw error;
  }
}

export async function startDemoLogin() {
  const attemptId = generateAttemptId();
  const { setActiveOAuthAttemptId, clearActiveOAuthAttemptId } = useAuthStore.getState();
  setActiveOAuthAttemptId(attemptId);

  const apiUrl = getApiUrl();
  if (new URL(apiUrl).protocol !== "https:") {
    throw new Error("Demo login requires an HTTPS backend URL.");
  }

  try {
    // Demo provisioning needs no OAuth/browser hop, so fetch the token
    // directly and skip the WebBrowser/redirect round trip entirely.
    const response = await fetch(
      `${apiUrl}/api/mobile-auth/demo?attemptId=${encodeURIComponent(attemptId)}`,
      { headers: { Accept: "application/json" } },
    );

    if (shouldLogAuthFlow()) {
      console.info("[mobile-auth] startDemoLogin", { ok: response.ok, status: response.status });
    }

    if (!response.ok) {
      throw new Error(`Failed to start demo session: ${await getResponseError(response)}`);
    }

    const rawBody: unknown = await response.json();
    if (!isDemoLoginResponse(rawBody)) {
      throw new Error("Demo login response was malformed");
    }
    const body = rawBody;

    if (useAuthStore.getState().activeOAuthAttemptId !== attemptId) {
      return;
    }

    await saveAuthToken(body.token);

    // A newer attempt may have started while the token was being persisted —
    // don't let a stale attempt clobber its state or navigation.
    if (useAuthStore.getState().activeOAuthAttemptId !== attemptId) {
      return;
    }

    useAuthStore.getState().setAuthenticated(true);
    useAuthStore.getState().setSessionExpiresAt(body.expiresAt);
    useAuthStore.getState().setDemoSession({ isDemo: true, expiresAt: body.expiresAt });
    clearActiveOAuthAttemptId();
    router.replace("/(app)");
  } catch (error) {
    if (useAuthStore.getState().activeOAuthAttemptId === attemptId) {
      clearActiveOAuthAttemptId();
    }
    throw error;
  }
}

export async function startDevLogin(email: string) {
  const response = await fetch(
    `${getApiUrl()}/api/mobile-auth/dev?email=${encodeURIComponent(email)}`,
  );

  if (shouldLogAuthFlow()) {
    console.info("[mobile-auth] startDevLogin", { ok: response.ok, status: response.status });
  }

  if (!response.ok) {
    throw new Error(`Failed to sign in dev user: ${await getResponseError(response)}`);
  }

  return (await response.json()) as DevLoginResponse;
}