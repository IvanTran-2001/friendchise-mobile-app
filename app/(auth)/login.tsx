import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/features/auth/auth-store";
import { saveAuthToken } from "../../src/features/auth/token-store";
import {
  fetchDevUsers,
  startDevLogin,
  startOAuthLogin,
  type AuthProvider,
} from "../../src/features/auth/auth-api";

export default function LoginScreen() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const mutation = useMutation({
    mutationFn: (provider: AuthProvider) => startOAuthLogin(provider),
  });
  const devUsersQuery = useQuery({
    queryKey: ["dev-users"],
    queryFn: fetchDevUsers,
    enabled: __DEV__,
  });
  const devLoginMutation = useMutation({
    mutationFn: async (email: string) => {
      const { token } = await startDevLogin(email);
      await saveAuthToken(token);
    },
    onSuccess: () => {
      setAuthenticated(true);
      router.replace("/(app)");
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>FriendChise</Text>
      <Text style={styles.subtitle}>Sign in with Google or LinkedIn.</Text>
      <Text style={styles.helper}>
        You will be sent back to the app after sign in.
      </Text>

      <Pressable
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        onPress={() => mutation.mutate("google")}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending ? "Opening Google..." : "Continue with Google"}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          styles.linkedInButton,
          mutation.isPending && styles.buttonDisabled,
        ]}
        onPress={() => mutation.mutate("linkedin")}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending
            ? "Opening LinkedIn..."
            : "Continue with LinkedIn"}
        </Text>
      </Pressable>

      {__DEV__ ? (
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>Dev users</Text>
          <Text style={styles.devHelper}>
            Development only. Pick a seeded user to sign in without Google or
            LinkedIn.
          </Text>

          {devUsersQuery.isLoading ? (
            <Text style={styles.devStatus}>Loading dev users...</Text>
          ) : devUsersQuery.error ? (
            <Text style={styles.error}>Could not load dev users.</Text>
          ) : (
            devUsersQuery.data?.map((user) => (
              <Pressable
                key={user.email}
                style={[
                  styles.devUserButton,
                  devLoginMutation.isPending && styles.buttonDisabled,
                ]}
                onPress={() => devLoginMutation.mutate(user.email)}
                disabled={devLoginMutation.isPending}
              >
                <Text style={styles.devUserLabel}>
                  {devLoginMutation.isPending &&
                  devLoginMutation.variables === user.email
                    ? "Signing in..."
                    : user.label}
                </Text>
                <Text style={styles.devUserMeta}>
                  {user.role ? `${user.role} · ` : ""}
                  {user.email}
                </Text>
              </Pressable>
            ))
          )}

          {devLoginMutation.error ? (
            <Text style={styles.error}>Could not sign in as dev user.</Text>
          ) : null}
        </View>
      ) : null}

      {mutation.error ? (
        <Text style={styles.error}>Could not open sign in.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 16,
    marginBottom: 8,
  },
  helper: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 20,
  },
  devSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.35)",
    gap: 10,
  },
  devTitle: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "700",
  },
  devHelper: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
  },
  devStatus: {
    color: "#CBD5E1",
    fontSize: 13,
  },
  devUserButton: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  devUserLabel: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  devUserMeta: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  linkedInButton: {
    backgroundColor: "#0A66C2",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#05110A",
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    color: "#FCA5A5",
    marginTop: 12,
  },
});