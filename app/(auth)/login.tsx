import { View, Text, Pressable, StyleSheet } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { startOAuthLogin, type AuthProvider } from "../../src/features/auth/auth-api";

export default function LoginScreen() {
  const mutation = useMutation({
    mutationFn: (provider: AuthProvider) => startOAuthLogin(provider),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FriendChise</Text>
      <Text style={styles.subtitle}>Sign in with Google or LinkedIn.</Text>
      <Text style={styles.helper}>You will be sent back to the app after sign in.</Text>

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
        style={[styles.button, styles.linkedInButton, mutation.isPending && styles.buttonDisabled]}
        onPress={() => mutation.mutate("linkedin")}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending
            ? "Opening LinkedIn..."
            : "Continue with LinkedIn"}
        </Text>
      </Pressable>

      {mutation.error ? (
        <Text style={styles.error}>Could not open sign in.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#0B1220",
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