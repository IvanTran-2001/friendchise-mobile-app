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
import { colors, spacing } from "../../src/lib/theme";

const logoSource = require("../../public/LOGO.png");

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
      <Screen
        edges={["top", "bottom"]}
        scroll
        centered
        keyboardAvoiding
        contentStyle={styles.screenContent}
      >
        <AuthCard style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.logoShell}>
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text variant="label" tone="accent" align="center" style={styles.kicker}>
              FriendChise
            </Text>
            <Text variant="title" align="center" style={styles.title}>
              Sign in to your workspace
            </Text>
            <Text variant="bodyLarge" tone="secondary" align="center" style={styles.subtitle}>
              Use your account to continue.
            </Text>
          </View>

          <View style={styles.actions}>
            <AuthProviderButton
              provider="apple"
              label="Continue with Apple"
              loadingLabel="Opening Apple..."
              onPress={() => mutation.mutate("apple")}
              disabled={mutation.isPending}
            />

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
  screenContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  card: {
    maxWidth: 400,
  },
  hero: {
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  logoShell: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    marginBottom: spacing.sm,
  },
  kicker: {
    marginBottom: 2,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    maxWidth: 320,
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  actions: {
    width: "100%",
    maxWidth: 360,
    gap: spacing.sm,
  },
  demoSection: {
    marginTop: 2,
    gap: spacing.xs + 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  dividerLine: {
    flex: 1,
  },
  error: {
    marginTop: spacing.md,
  },
});