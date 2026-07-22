import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/features/auth/auth-store";
import { saveAuthToken } from "../../src/features/auth/token-store";
import { fetchDevUsers, startDevLogin } from "../../src/features/auth/auth-api";
import { AuthCard } from "../../components/auth/auth-ui";
import { Text } from "../../components/ui/text";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";

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
    () => [styles.toggle, { top: insets.top + 72, left: spacing.lg }],
    [insets.top],
  );

  const devPanelStyle = useMemo(
    () => [styles.panel, { top: insets.top + 126, left: spacing.lg }],
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
        <Text variant="label" tone="inverse" style={styles.toggleIcon}>
          {open ? "-" : "+"}
        </Text>
        <Text variant="label" tone="inverse">
          dev signin
        </Text>
      </Pressable>

      {open ? (
        <AuthCard style={devPanelStyle}>
          <Text variant="heading">Dev users</Text>
          <Text variant="caption" tone="secondary" style={styles.helper}>
            Development only. Pick a seeded user to sign in without Google or LinkedIn.
          </Text>

          <ScrollView
            style={styles.userList}
            contentContainerStyle={styles.userListContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {devUsersQuery.isLoading ? (
              <Text variant="caption" tone="secondary">
                Loading dev users...
              </Text>
            ) : devUsersQuery.error ? (
              <Text variant="caption" tone="danger">
                Could not load dev users.
              </Text>
            ) : (
              devUsersQuery.data?.map((user) => (
                <Pressable
                  key={user.email}
                  style={({ pressed }) => [
                    styles.userButton,
                    pressed && styles.userButtonPressed,
                    devLoginMutation.isPending && styles.disabled,
                  ]}
                  onPress={() => devLoginMutation.mutate(user.email)}
                  disabled={devLoginMutation.isPending}
                >
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {devLoginMutation.isPending && devLoginMutation.variables === user.email
                      ? "Signing in..."
                      : user.label}
                  </Text>
                  <Text variant="caption" tone="secondary" style={styles.userMeta} numberOfLines={1}>
                    {user.role ? `${user.role} · ` : ""}
                    {user.email}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>

          {devLoginMutation.error ? (
            <Text variant="caption" tone="danger" style={styles.error}>
              Could not sign in as dev user.
            </Text>
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
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.55)",
    ...shadows.lg,
  },
  togglePressed: {
    opacity: 0.85,
  },
  toggleOpen: {
    backgroundColor: colors.accentStrong,
  },
  toggleIcon: {
    fontSize: 18,
  },
  panel: {
    position: "absolute",
    width: 290,
    maxWidth: 290,
    maxHeight: 310,
    gap: spacing.sm,
  },
  helper: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  userList: {
    maxHeight: 170,
  },
  userListContent: {
    gap: spacing.xs,
    paddingBottom: 2,
  },
  userButton: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userButtonPressed: {
    opacity: 0.8,
  },
  userMeta: {
    marginTop: spacing.xs,
  },
  disabled: {
    opacity: 0.7,
  },
  error: {
    marginTop: spacing.xs,
  },
});