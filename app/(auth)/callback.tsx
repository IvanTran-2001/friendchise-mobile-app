import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { saveAuthToken } from "../../src/features/auth/token-store";
import { useAuthStore } from "../../src/features/auth/auth-store";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const params = useLocalSearchParams<{
    token?: string | string[];
    access_token?: string | string[];
    error?: string | string[];
  }>();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    const token = firstParam(params.token) ?? firstParam(params.access_token);
    const error = firstParam(params.error);

    if (error) {
      setMessage(`Sign in failed: ${error}`);
      return;
    }

    if (!token) {
      setMessage("Waiting for the backend to return a token...");
      return;
    }

    saveAuthToken(token)
      .then(() => {
        setAuthenticated(true);
        router.replace("/(app)");
      })
      .catch(() => {
        setMessage("Could not save the auth token.");
      });
  }, [params.access_token, params.error, params.token, router, setAuthenticated]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FriendChise</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    color: "#94A3B8",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});