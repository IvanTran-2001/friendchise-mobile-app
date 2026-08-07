import * as ExpoLinking from "expo-linking";
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

async function getResponseError(response: Response) {
  const body = await response.text();
  return body || response.statusText || `HTTP ${response.status}`;
}

export async function fetchDevUsers() {
  const response = await fetch(`${getApiUrl()}/api/mobile-auth/dev-users`);

  if (!response.ok) {
    throw new Error(`Failed to load dev users: ${await getResponseError(response)}`);
  }

  return (await response.json()) as DevUser[];
}

export async function startOAuthLogin(provider: AuthProvider) {
  const callbackUrl = ExpoLinking.createURL("/callback");
  const completeUrl = `/api/mobile-auth/complete?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  // Not /api/auth/signin/[provider] directly — Auth.js requires a CSRF-tokened
  // POST there, which a plain browser GET can't provide (fails with
  // error=Configuration). This mobile-only route calls signIn() internally instead.
  const url = `${getApiUrl()}/api/mobile-auth/oauth-start/${provider}?callbackUrl=${encodeURIComponent(completeUrl)}`;
  await Linking.openURL(url);
}

export async function startDevLogin(email: string) {
  const response = await fetch(
    `${getApiUrl()}/api/mobile-auth/dev?email=${encodeURIComponent(email)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to sign in dev user: ${await getResponseError(response)}`);
  }

  return (await response.json()) as DevLoginResponse;
}