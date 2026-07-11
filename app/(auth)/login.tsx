import { useMemo } from "react";
import { Image, View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { getApiUrl } from "../../src/lib/config";
import { startOAuthLogin, type AuthProvider } from "../../src/features/auth/auth-api";
import { DevUsersOverlay } from "./dev-users-overlay";
import { AuthCard, AuthProviderButton } from "../../components/auth/auth-ui";
import { APP_SHELL_BG } from "../../src/lib/theme";

export default function LoginScreen() {
  const logoUri = useMemo(() => `${getApiUrl()}/Logo4.png`, []);
  const mutation = useMutation({
    mutationFn: (provider: AuthProvider) => startOAuthLogin(provider),
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {__DEV__ ? <DevUsersOverlay /> : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <AuthCard style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.subtitle}>Sign in with Google or LinkedIn.</Text>
            <Text style={styles.helper}>You will be sent back to the app after sign in.</Text>
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
          <Text style={styles.error}>Could not open sign in.</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_SHELL_BG,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#334155",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  helper: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
  },
  logoFrame: {
    width: 180,
    height: 180,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3,
  },
  logoImage: {
    width: 132,
    height: 132,
  },
  actions: {
    width: "100%",
    maxWidth: 360,
    gap: 10,
  },
  error: {
    color: "#B91C1C",
    marginTop: 12,
  },
});