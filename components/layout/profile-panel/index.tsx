import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Home } from "lucide-react-native";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { Avatar, getInitials } from "../../ui/avatar";
import { IconButton } from "../../ui/icon-button";
import { useGlobalSheet } from "../global-sheet";
import { ProfileSheet } from "./profile-sheet";
import { colors, radius, spacing } from "../../../src/lib/theme";
import { fetchOrganizations, type Org } from "../../../src/features/orgs/org-mode/shared/organization-api";
import { useMe } from "../../../src/features/auth";
import { LogoMark } from "./logo-mark";

/**
 * Profile trigger shown in the app navbar.
 *
 * It displays the current user and organization avatars, then opens the
 * shared profile sheet when pressed.
 */
export function ProfileOrgButton() {
  const { openSheet, closeSheet } = useGlobalSheet();
  const router = useRouter();
  const currentOrgId = useCurrentOrgId();
  const { data: meData } = useMe();
  const { data: orgData } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const currentUser = meData?.user ?? null;
  const currentOrg = orgData?.organizations.find((org: Org) => org.id === currentOrgId) ?? null;
  const userInitials = useMemo(() => getInitials(currentUser?.name), [currentUser?.name]);

  const handleGoHome = () => {
    closeSheet();
    router.replace("/(app)");
  };

  const handleOpenProfile = () => {
    openSheet(<ProfileSheet />, {
      title: "Profile",
      subtitle: "Organization and account controls",
      headerRight: (
        <IconButton
          size="md"
          variant="filled"
          accessibilityLabel="Go to global home"
          onPress={handleGoHome}
          style={styles.homeButton}
        >
          <Home size={18} strokeWidth={2.6} color={colors.textInverse} />
        </IconButton>
      ),
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityLabel="Open profile panel"
      onPress={handleOpenProfile}
    >
      <View style={styles.buttonContent}>
        <ProfileCluster currentUser={currentUser} currentOrg={currentOrg} userInitials={userInitials} />
      </View>
    </Pressable>
  );
}

type ProfileClusterProps = {
  currentUser: import("../../../src/features/auth").MeUser | null;
  currentOrg: Org | null;
  userInitials: string;
};

/**
 * Compact avatar cluster used by the profile trigger.
 */
function ProfileCluster({ currentUser, currentOrg, userInitials }: ProfileClusterProps) {
  return (
    <View style={styles.avatarCluster}>
      <Avatar imageUri={currentUser?.image} label={userInitials} size="sm" />
      <View style={styles.avatarDivider} />
      {currentOrg ? (
        <Avatar imageUri={currentOrg.image} label={getInitials(currentOrg.name)} size="sm" tintId={currentOrg.id} />
      ) : (
        <LogoMark size={28} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonContent: {
    alignItems: "center",
    gap: spacing.xs,
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
  homeButton: {
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  notSelectedBadge: {
    width: 28,
    height: 28,
  },
});
