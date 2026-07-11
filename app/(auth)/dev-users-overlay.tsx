import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/features/auth/auth-store";
import { saveAuthToken } from "../../src/features/auth/token-store";
import { fetchDevUsers, startDevLogin } from "../../src/features/auth/auth-api";
import { AuthCard } from "../../components/auth/auth-ui";
import { APP_SHELL_BG } from "../../src/lib/theme";

export function DevUsersOverlay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const devUsersQuery = useQuery({
    queryKey: ["dev-users"],
    queryFn: fetchDevUsers,
    enabled: __DEV__ && open,
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

  const panelStyle = useMemo(
    () => [styles.toggle, { top: insets.top + 72, left: 16 }],
    [insets.top],
  );

  const devPanelStyle = useMemo(
    () => [styles.panel, { top: insets.top + 126, left: 16 }],
    [insets.top],
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [
          panelStyle,
          pressed && styles.togglePressed,
          open && styles.toggleOpen,
        ]}
        onPress={() => setOpen((value) => !value)}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={open ? "Hide dev users" : "Show dev users"}
      >
        <Text style={styles.toggleIcon}>{open ? "-" : "+"}</Text>
        <Text style={styles.toggleLabel}>dev signin</Text>
      </Pressable>

      {open ? (
        <AuthCard style={devPanelStyle}>
          <Text style={styles.title}>Dev users</Text>
          <Text style={styles.helper}>
            Development only. Pick a seeded user to sign in without Google or LinkedIn.
          </Text>

          <ScrollView
            style={styles.userList}
            contentContainerStyle={styles.userListContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {devUsersQuery.isLoading ? (
              <Text style={styles.status}>Loading dev users...</Text>
            ) : devUsersQuery.error ? (
              <Text style={styles.error}>Could not load dev users.</Text>
            ) : (
              devUsersQuery.data?.map((user) => (
                <Pressable
                  key={user.email}
                  style={[
                    styles.userButton,
                    devLoginMutation.isPending && styles.disabled,
                  ]}
                  onPress={() => devLoginMutation.mutate(user.email)}
                  disabled={devLoginMutation.isPending}
                >
                  <Text style={styles.userLabel}>
                    {devLoginMutation.isPending &&
                    devLoginMutation.variables === user.email
                      ? "Signing in..."
                      : user.label}
                  </Text>
                  <Text style={styles.userMeta}>
                    {user.role ? `${user.role} · ` : ""}
                    {user.email}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>

          {devLoginMutation.error ? (
            <Text style={styles.error}>Could not sign in as dev user.</Text>
          ) : null}
        </AuthCard>
      ) : null}
    </View>
  );
}

export default DevUsersOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
    alignItems: "flex-start",
  },
  toggle: {
    position: "absolute",
    minWidth: 108,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(37, 99, 235, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  togglePressed: {
    opacity: 0.85,
  },
  toggleOpen: {
    backgroundColor: "rgba(30, 64, 175, 0.98)",
  },
  toggleIcon: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
    marginTop: -1,
  },
  toggleLabel: {
    color: "#FFF7ED",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  panel: {
    position: "absolute",
    width: 290,
    maxWidth: 290,
    maxHeight: 310,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: APP_SHELL_BG,
    padding: 14,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  title: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  helper: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  userList: {
    maxHeight: 170,
  },
  userListContent: {
    gap: 4,
    paddingBottom: 2,
  },
  status: {
    color: "#334155",
    fontSize: 13,
  },
  userButton: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: APP_SHELL_BG,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userLabel: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  userMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
  },
  disabled: {
    opacity: 0.7,
  },
  error: {
    color: "#B91C1C",
    marginTop: 4,
  },
});