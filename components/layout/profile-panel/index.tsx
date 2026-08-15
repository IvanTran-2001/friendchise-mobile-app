import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react-native";
import { apiFetch } from "../../../src/lib/api/client";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearAuthToken } from "../../../src/features/auth/token-store";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { colors, radius, spacing } from "../../../src/lib/theme";
import { Avatar, getInitials } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { SheetModal } from "../../ui/sheet-modal";
import { Text } from "../../ui/text";
import { OrgSwitcher } from "./org-switcher";
import { fetchOrganizations } from "../../../src/features/orgs/organization-api";

type MeResponse = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

async function fetchMe() {
  return apiFetch<MeResponse>("/api/mobile/me");
}

export function ProfileOrgButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentOrgId = useCurrentOrgId();
  const [profileOpen, setProfileOpen] = useState(false);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const { data: meData } = useQuery({
    queryKey: ["mobile-me"],
    queryFn: fetchMe,
  });
  const { data: orgData } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const currentUser = meData?.user ?? null;
  const currentOrg = orgData?.organizations.find((org) => org.id === currentOrgId) ?? null;
  const userInitials = useMemo(() => getInitials(currentUser?.name), [currentUser?.name]);
  const orgLabel = currentOrg ? currentOrg.name : "Not selected";

  const handleLogout = async () => {
    setProfileOpen(false);
    await clearAuthToken();
    queryClient.clear();
    setAuthenticated(false);
    router.replace("/(auth)/login");
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Open profile and organization panel"
        onPress={() => setProfileOpen(true)}
      >
        <View style={styles.avatarCluster}>
          <Avatar imageUri={currentUser?.image} label={userInitials} size="sm" />
          <View style={styles.avatarDivider} />
          {currentOrg ? (
            <Avatar imageUri={currentOrg.image} label={getInitials(currentOrg.name)} size="sm" tintId={currentOrg.id} />
          ) : (
            <View style={styles.notSelectedBadge}>
              <Text variant="captionStrong" tone="tertiary">
                ?
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <SheetModal visible={profileOpen} onClose={() => setProfileOpen(false)}>
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            {currentUser?.image ? (
              <Avatar imageUri={currentUser.image} label={userInitials} size="xl" />
            ) : (
              <UserRound size={28} strokeWidth={2.1} color={colors.accent} />
            )}
          </View>

          <Text variant="title" numberOfLines={1} align="center">
            {currentUser?.name ?? "Your profile"}
          </Text>

          <Badge label={orgLabel} tone="accent" />
        </View>

        <View style={styles.panelBody}>
          <View style={styles.section}>
            <Text variant="label" tone="secondary">
              Organization
            </Text>
            <OrgSwitcher currentOrgId={currentOrgId} />
          </View>

          <View style={styles.section}>
            <Text variant="label" tone="secondary">
              Account
            </Text>
            <Button label="Logout" onPress={handleLogout} variant="secondary" fullWidth />
          </View>
        </View>
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  avatarCluster: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  avatarDivider: {
    width: spacing.sm,
  },
  notSelectedBadge: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    marginBottom: spacing.xs,
    overflow: "hidden",
  },
  panelBody: {
    flex: 1,
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
});
