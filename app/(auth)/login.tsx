import { useMemo } from "react";
import { Image, View, StyleSheet } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { getApiUrl } from "../../src/lib/config";
import { startOAuthLogin, type AuthProvider } from "../../src/features/auth/auth-api";
import { DevUsersOverlay } from "./dev-users-overlay";
import { AuthCard, AuthProviderButton } from "../../components/auth/auth-ui";
import { Screen } from "../../components/ui/screen";
import { Text } from "../../components/ui/text";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";

export default function LoginScreen() {
  const logoUri = useMemo(() => `${getApiUrl()}/Logo4.png`, []);
  const mutation = useMutation({
    mutationFn: (provider: AuthProvider) => startOAuthLogin(provider),
  });

  return (
    <View style={styles.root}>
      <Screen scroll centered keyboardAvoiding>
        <AuthCard style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text variant="bodyLarge" tone="secondary" align="center" style={styles.subtitle}>
              Sign in with Google or LinkedIn.
            </Text>
            <Text variant="caption" tone="tertiary" align="center" style={styles.helper}>
              You will be sent back to the app after sign in.
            </Text>
          </View>

          <View style={styles.actions}>
            <AuthProviderButton
              provider="google"
              label="Continue with Google"
              loadingLabel="Opening Google..."
              onPress={() => mutation.mutate("google")}
              disabled={mutation.isPending}
            />

            <AuthProviderButton
              provider="linkedin"
              label="Continue with LinkedIn"
              loadingLabel="Opening LinkedIn..."
              onPress={() => mutation.mutate("linkedin")}
              disabled={mutation.isPending}
            />
          </View>
        </AuthCard>

        {mutation.error ? (
          <Text variant="caption" tone="danger" style={styles.error}>
            Could not open sign in.
          </Text>
        ) : null}
      </Screen>

      {__DEV__ ? <DevUsersOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    maxWidth: 380,
  },
  hero: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
  helper: {
    marginBottom: spacing.xl,
  },
  logoFrame: {
    width: 180,
    height: 180,
    borderRadius: radius.xxl + 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoImage: {
    width: 132,
    height: 132,
  },
  actions: {
    width: "100%",
    maxWidth: 360,
    gap: spacing.sm + 2,
  },
  error: {
    marginTop: spacing.md,
  },
});