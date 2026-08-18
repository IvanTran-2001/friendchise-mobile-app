import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { Linking } from "react-native";
import { getApiUrl } from "../../lib/config";

export type AuthProvider = "google" | "linkedin";

export type DevUser = {
  email: string;
  label: string;
  role: string;
};

type DevLoginResponse = {
  token: string;
};

function shouldLogAuthFlow() {
  return __DEV__;
}

function generateAttemptId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Strips the token value before logging a callback URL so we never print credentials.
function redactCallbackUrl(url: string) {
  try {
    const parsed = new URL(url.replace(/^([a-z][a-z0-9+.-]*):\/\//i, "https://"));
    if (parsed.searchParams.has("token")) {
      parsed.searchParams.set("token", "<redacted>");
    }
    return parsed.pathname + "?" + parsed.searchParams.toString();
  } catch {
    return "<unparseable>";
  }
}

async function getResponseError(response: Response) {
  const body = await response.text();
  return body || response.statusText || `HTTP ${response.status}`;
}

// Diagnostic only — detects whether a second OAuth transaction starts before
// the first one resolved. Not a fix; do not turn this into a silent no-op.
let activeOAuthAttemptId: string | null = null;

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

  if (activeOAuthAttemptId) {
    console.warn(`${logPrefix} another OAuth attempt is already active`, {
      activeOAuthAttemptId,
    });
  }
  activeOAuthAttemptId = attemptId;

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
      router.replace({ pathname: "/callback", params: queryParams ?? undefined });
    }
  } finally {
    if (activeOAuthAttemptId === attemptId) {
      activeOAuthAttemptId = null;
    }
  }
}

export async function startDemoLogin() {
  const callbackUrl = ExpoLinking.createURL("/callback");
  const url = `${getApiUrl()}/api/mobile-auth/demo?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  if (shouldLogAuthFlow()) {
    console.info("[mobile-auth] startDemoLogin", {
      callbackUrl,
      url,
    });
  }

  await Linking.openURL(url);
}

export async function startDevLogin(email: string) {
  const response = await fetch(
    `${getApiUrl()}/api/mobile-auth/dev?email=${encodeURIComponent(email)}`,
  );

  if (shouldLogAuthFlow()) {
    console.info("[mobile-auth] startDevLogin", { email, ok: response.ok, status: response.status });
  }

  if (!response.ok) {
    throw new Error(`Failed to sign in dev user: ${await getResponseError(response)}`);
  }

  return (await response.json()) as DevLoginResponse;
}