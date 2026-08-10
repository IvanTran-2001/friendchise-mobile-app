import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "friendchise.auth.token";

let webToken: string | null = null;

function getWebStorage() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

async function setToken(token: string) {
  if (Platform.OS === "web") {
    webToken = token;

    const storage = getWebStorage();
    if (storage) {
      storage.setItem(TOKEN_KEY, token);
    }

    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getToken() {
  if (Platform.OS === "web") {
    const storage = getWebStorage();
    const storedToken = storage?.getItem(TOKEN_KEY) ?? null;

    if (storedToken) {
      webToken = storedToken;
      return storedToken;
    }

    return webToken;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function deleteToken() {
  if (Platform.OS === "web") {
    webToken = null;

    const storage = getWebStorage();
    storage?.removeItem(TOKEN_KEY);

    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveAuthToken(token: string) {
  await setToken(token);
}

export async function getAuthToken() {
  return getToken();
}

export async function clearAuthToken() {
  await deleteToken();
}