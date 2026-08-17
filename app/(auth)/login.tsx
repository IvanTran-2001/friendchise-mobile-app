import { useMemo } from "react";
import { Image, View, StyleSheet } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react-native";
import { getApiUrl } from "../../src/lib/config";
import {
  startDemoLogin,
  startOAuthLogin,
  type AuthProvider,
} from "../../src/features/auth/auth-api";
import { DevUsersOverlay } from "./dev-users-overlay";
import { AuthCard, AuthProviderButton } from "../../components/auth/auth-ui";
import { Screen } from "../../components/ui/screen";
import { Text } from "../../components/ui/text";
import { Button } from "../../components/ui/button";
import { Divider } from "../../components/ui/divider";
import { ErrorState } from "../../components/ui/state-views";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export default function LoginScreen() {
  const apiUrlResult = useMemo(() => {
    try {
      return { apiUrl: getApiUrl(), error: null as string | null };
    } catch (error) {
      return { apiUrl: null, error: describeError(error) };
    }
  }, []);

  const logoUri = useMemo(
    () => (apiUrlResult.apiUrl ? `${apiUrlResult.apiUrl}/Logo4.png` : null),
    [apiUrlResult.apiUrl],
  );
  const mutation = useMutation({
    mutationFn: (method: AuthProvider | "demo") =>
      method === "demo" ? startDemoLogin() : startOAuthLogin(method),
  });

  if (apiUrlResult.error) {
    return (
      <View style={styles.root}>
        <Screen edges={["top", "bottom"]} centered>
          <AuthCard style={styles.card}>
            <ErrorState title="Backend URL missing" message={apiUrlResult.error} compact />
          </AuthCard>
        </Screen>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Screen edges={["top", "bottom"]} scroll centered keyboardAvoiding>
        <AuthCard style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
              ) : null}
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
            <DemoAccessSection
              onPress={() => mutation.mutate("demo")}
              pending={mutation.isPending}
              loading={mutation.isPending && mutation.variables === "demo"}
            />
          </View>
        </AuthCard>

        {mutation.error ? (
          <Text variant="caption" tone="danger" style={styles.error}>
            Could not open sign in. {describeError(mutation.error)}
          </Text>
        ) : null}
      </Screen>

      {__DEV__ ? <DevUsersOverlay /> : null}
    </View>
  );
}

type DemoAccessSectionProps = {
  onPress: () => void;
  pending: boolean;
  loading: boolean;
};

function DemoAccessSection({ onPress, pending, loading }: DemoAccessSectionProps) {
  return (
    <View style={styles.demoSection}>
      <View style={styles.dividerRow}>
        <Divider style={styles.dividerLine} />
        <Text variant="label" tone="tertiary">
          OR
        </Text>
        <Divider style={styles.dividerLine} />
      </View>
      <Button
        label="Try Demo"
        variant="secondary"
        size="md"
        leftIcon={<Sparkles size={16} color={colors.accent} />}
        onPress={onPress}
        disabled={pending}
        loading={loading}
        loadingLabel="Opening demo..."
        fullWidth
      />
      <Text variant="caption" tone="tertiary" align="center">
        No account needed — explore a seeded workspace.
      </Text>
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
  demoSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
  },
  error: {
    marginTop: spacing.md,
  },
});