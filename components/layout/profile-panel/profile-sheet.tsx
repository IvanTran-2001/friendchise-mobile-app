import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings2, UserRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearSessionAndRedirect, useMe, type MeUser } from "../../../src/features/auth";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { Avatar, getInitials } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Text } from "../../ui/text";
import { colors, spacing } from "../../../src/lib/theme";
import { OrgSwitcher } from "./org-switcher";
import { useGlobalSheet } from "../global-sheet";
import { SettingsSheet } from "./settings-sheet";
import { fetchOrganizations } from "../../../src/features/orgs/organization-api";

export function ProfileSheet() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openSheet, closeSheet } = useGlobalSheet();
  const currentOrgId = useCurrentOrgId();

  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const { data: meData } = useMe();
  const { data: orgData } = useQuery({
    queryKey: ["mobile-orgs"],
    queryFn: fetchOrganizations,
  });

  const currentUser = meData?.user ?? null;
  const currentOrg = orgData?.organizations.find((org) => org.id === currentOrgId) ?? null;
  const userInitials = useMemo(() => getInitials(currentUser?.name), [currentUser?.name]);
  const orgLabel = currentOrg ? currentOrg.name : "Not selected";

  const handleOpenSettings = () => {
    openSheet(<SettingsSheet />, {
      title: "Settings",
      subtitle: "App and account preferences",
    });
  };

  return (
    <View style={styles.body}>
      <ProfilePanel currentUser={currentUser} userInitials={userInitials} orgLabel={orgLabel} />
      <OrganizationPanel currentOrgId={currentOrgId} />
      <AccountPanel
        onOpenSettings={handleOpenSettings}
        onLogout={() => void handleLogout({ closeSheet, queryClient, setAuthenticated, router })}
      />
    </View>
  );
}

type ProfilePanelProps = {
  currentUser: MeUser | null;
  userInitials: string;
  orgLabel: string;
};

function ProfilePanel({ currentUser, userInitials, orgLabel }: ProfilePanelProps) {
  return (
    <View style={styles.section}>
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
    </View>
  );
}

type OrganizationPanelProps = {
  currentOrgId: string | null;
};

function OrganizationPanel({ currentOrgId }: OrganizationPanelProps) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="secondary">
        Organization
      </Text>
      <OrgSwitcher currentOrgId={currentOrgId} />
    </View>
  );
}

type AccountPanelProps = {
  onOpenSettings: () => void;
  onLogout: () => void;
};

function AccountPanel({ onOpenSettings, onLogout }: AccountPanelProps) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="secondary">
        Account
      </Text>
      <Button
        label="Settings"
        onPress={onOpenSettings}
        variant="secondary"
        fullWidth
        leftIcon={<Settings2 size={16} strokeWidth={2.2} color={colors.accent} />}
      />
      <LogoutButton onPress={onLogout} />
    </View>
  );
}

type LogoutActionArgs = {
  closeSheet: () => void;
  queryClient: ReturnType<typeof useQueryClient>;
  setAuthenticated: (authenticated: boolean) => void;
  router: ReturnType<typeof useRouter>;
};

async function handleLogout({ closeSheet, queryClient, setAuthenticated, router }: LogoutActionArgs) {
  closeSheet();
  await clearSessionAndRedirect({ queryClient, setAuthenticated, router });
}

type LogoutButtonProps = {
  onPress: () => void;
};

function LogoutButton({ onPress }: LogoutButtonProps) {
  return (
    <Button
      label="Logout"
      onPress={onPress}
      variant="danger"
      fullWidth
      leftIcon={<LogOut size={16} strokeWidth={2.2} color={colors.danger} />}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
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
});