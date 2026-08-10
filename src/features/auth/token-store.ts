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

    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getToken() {
  if (Platform.OS === "web") {
    if (webToken) {
      return webToken;
    }

    const storage = getWebStorage();
    if (!storage) {
      return webToken;
    }

    try {
      const storedToken = storage.getItem(TOKEN_KEY);
      if (storedToken) {
        webToken = storedToken;

        try {
          storage.removeItem(TOKEN_KEY);
        } catch {
          // If cleanup fails, keep the in-memory token and continue.
        }

        return storedToken;
      }
    } catch {
      return webToken;
    }

    return webToken;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function deleteToken() {
  if (Platform.OS === "web") {
    const storage = getWebStorage();
    if (storage) {
      try {
        storage.removeItem(TOKEN_KEY);
        webToken = null;
      } catch {
        return;
      }
    } else {
      webToken = null;
    }

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