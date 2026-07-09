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

export async function fetchDevUsers() {
  const response = await fetch(`${getApiUrl()}/api/mobile-auth/dev-users`);

  if (!response.ok) {
    throw new Error(`Failed to load dev users: ${response.status}`);
  }

  return (await response.json()) as DevUser[];
}

export async function startOAuthLogin(provider: AuthProvider) {
  const callbackUrl = ExpoLinking.createURL("/callback");
  const completeUrl = `/api/mobile-auth/complete?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const url = `${getApiUrl()}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(completeUrl)}`;
  await Linking.openURL(url);
}

export async function startDevLogin(email: string) {
  const response = await fetch(
    `${getApiUrl()}/api/mobile-auth/dev?email=${encodeURIComponent(email)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to sign in dev user: ${response.status}`);
  }

  return (await response.json()) as DevLoginResponse;
}