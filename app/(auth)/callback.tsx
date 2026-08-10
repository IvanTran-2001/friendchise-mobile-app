import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { saveAuthToken } from "../../src/features/auth/token-store";
import { useAuthStore } from "../../src/features/auth/auth-store";
import { Screen } from "../../components/ui/screen";
import { Text } from "../../components/ui/text";
import { colors, spacing } from "../../src/lib/theme";

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
  const token = firstParam(params.token) ?? firstParam(params.access_token);
  const error = firstParam(params.error);

  const message = error
    ? `Sign in failed: ${error}`
    : token
      ? "Completing sign in..."
      : "Waiting for the backend to return a token...";

  useEffect(() => {
    if (error || !token) {
      return;
    }

    saveAuthToken(token)
      .then(() => {
        setAuthenticated(true);
        router.replace("/(app)");
      })
      .catch(() => {
        router.replace("/(auth)/login");
      });
  }, [error, router, setAuthenticated, token]);

  return (
    <Screen edges={["top", "bottom"]} centered>
      <Text variant="title" align="center" style={styles.title}>
        Friendchise
      </Text>
      {!error ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}
      <Text variant="body" tone={error ? "danger" : "secondary"} align="center" style={styles.message}>
        {message}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    maxWidth: 320,
  },
});