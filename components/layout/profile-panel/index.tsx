import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { Avatar, getInitials } from "../../ui/avatar";
import { useGlobalSheet } from "../global-sheet";
import { ProfileSheet } from "./profile-sheet";
import { colors, radius, spacing } from "../../../src/lib/theme";
import { Text } from "../../ui/text";
import { fetchOrganizations, type Org } from "../../../src/features/orgs/organization-api";
import { useMe, type MeUser } from "../../../src/features/auth";

/**
 * Profile trigger shown in the app navbar.
 *
 * It displays the current user and organization avatars, then opens the
 * shared profile sheet when pressed.
 */
export function ProfileOrgButton() {
  const { openSheet } = useGlobalSheet();
  const currentOrgId = useCurrentOrgId();
  const { data: meData } = useMe();
  const { data: orgData } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const currentUser = meData?.user ?? null;
  const currentOrg = orgData?.organizations.find((org) => org.id === currentOrgId) ?? null;
  const userInitials = useMemo(() => getInitials(currentUser?.name), [currentUser?.name]);

  const handleOpenProfile = () => {
    openSheet(<ProfileSheet />, {
      title: "Profile",
      subtitle: "Organization and account controls",
    });
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Open profile panel"
        onPress={handleOpenProfile}
      >
        <ProfileCluster currentUser={currentUser} currentOrg={currentOrg} userInitials={userInitials} />
      </Pressable>
    </>
  );
}

type ProfileClusterProps = {
  currentUser: MeUser | null;
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
        <View style={styles.notSelectedBadge}>
          <Text variant="captionStrong" tone="tertiary">
            ?
          </Text>
        </View>
      )}
    </View>
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
});
