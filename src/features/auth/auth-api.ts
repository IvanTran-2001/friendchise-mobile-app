import * as ExpoLinking from "expo-linking";
import { Linking } from "react-native";
import { getApiUrl } from "../../lib/config";

export type AuthProvider = "google" | "linkedin";

export async function startOAuthLogin(provider: AuthProvider) {
  const callbackUrl = ExpoLinking.createURL("/callback");
  const url = `${getApiUrl()}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  await Linking.openURL(url);
}