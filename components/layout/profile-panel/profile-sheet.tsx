import { useQueryClient } from "@tanstack/react-query";
import { Home, LogOut, Settings2, UserRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearSessionAndRedirect, useMe, type MeUser } from "../../../src/features/auth";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { Avatar, getInitials } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Text } from "../../ui/text";
import { colors, spacing } from "../../../src/lib/theme";
import { formatDemoCountdown } from "./profile-panel-utils";
import { useGlobalSheet } from "../global-sheet";
import { SettingsSheet } from "./settings-sheet";
import { OrgSwitcher } from "./org-switcher";

export function ProfileSheet() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openSheet, closeSheet } = useGlobalSheet();
  const currentOrgId = useCurrentOrgId();

  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setSessionExpiresAt = useAuthStore((state) => state.setSessionExpiresAt);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoExpiresAt = useAuthStore((state) => state.demoExpiresAt);
  const { data: meData } = useMe();

  const currentUser = meData?.user ?? null;
  const userInitials = useMemo(() => getInitials(currentUser?.name), [currentUser?.name]);

  const handleOpenSettings = () => {
    openSheet(<SettingsSheet />, {
      title: "Settings",
      subtitle: "App and account preferences",
    });
  };

  return (
    <View style={styles.body}>
      <ProfilePanel
        currentUser={currentUser}
        userInitials={userInitials}
        isDemo={isDemo}
        demoExpiresAt={demoExpiresAt}
      />
      <OrganizationPanel currentOrgId={currentOrgId} />
      <AccountPanel
        onOpenSettings={handleOpenSettings}
        onLogout={() =>
          void handleLogout({ closeSheet, queryClient, setAuthenticated, setSessionExpiresAt, setDemoSession, router })
        }
      />
    </View>
  );
}

type ProfilePanelProps = {
  currentUser: MeUser | null;
  userInitials: string;
  isDemo: boolean;
  demoExpiresAt: number | null;
};

type OrganizationPanelProps = {
  currentOrgId: string | null;
};

function ProfilePanel({ currentUser, userInitials, isDemo, demoExpiresAt }: ProfilePanelProps) {
  const [remaining, setRemaining] = useState(() => (demoExpiresAt ? demoExpiresAt - Date.now() : 0));

  useEffect(() => {
    if (!isDemo || !demoExpiresAt) {
      return;
    }

    setRemaining(demoExpiresAt - Date.now());
    const id = setInterval(() => {
      setRemaining(demoExpiresAt - Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, [demoExpiresAt, isDemo]);

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

        {currentUser?.email ? (
          <Text variant="caption" tone="secondary" align="center" numberOfLines={1}>
            {currentUser.email}
          </Text>
        ) : null}

        {isDemo ? (
          <Badge label={`Demo · ${formatDemoCountdown(remaining)}`} tone="danger" dotted />
        ) : null}
      </View>
    </View>
  );
}

function OrganizationPanel({ currentOrgId }: OrganizationPanelProps) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text variant="label" tone="secondary">
        Organization
      </Text>
      <Button
        label="Global home"
        onPress={() => router.replace("/(app)")}
        variant="secondary"
        fullWidth
        leftIcon={<Home size={16} strokeWidth={2.2} color={colors.accent} />}
      />
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
  setSessionExpiresAt: (expiresAt: number | null) => void;
  setDemoSession: (session: { isDemo: boolean; expiresAt: number | null }) => void;
  router: ReturnType<typeof useRouter>;
};

async function handleLogout({ closeSheet, queryClient, setAuthenticated, setSessionExpiresAt, setDemoSession, router }: LogoutActionArgs) {
  closeSheet();
  await clearSessionAndRedirect({ queryClient, setAuthenticated, setSessionExpiresAt, setDemoSession, router });
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