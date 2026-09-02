import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings2, UserRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, InteractionManager, Pressable, StyleSheet, View } from "react-native";
import { useAuthStore } from "../../../src/features/auth/auth-store";
import { clearSessionAndRedirect, useMe, type MeUser } from "../../../src/features/auth";
import { useCurrentOrgId } from "../../../hooks/use-current-org-id";
import { Avatar, getInitials } from "../../ui/avatar";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Text } from "../../ui/text";
import { colors, spacing } from "../../../src/lib/theme";
import { formatDemoCountdown } from "./profile-panel-utils";
import { useGlobalSheet } from "../global-sheet";
import { SettingsSheet } from "./settings-sheet";
import { OrgSwitcher } from "./org-switcher";

const logoSource = require("../../../public/LOGO.png");

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
  const { closeSheet } = useGlobalSheet();
  const router = useRouter();

  const handleGoHome = () => {
    router.replace("/(app)");
    void InteractionManager.runAfterInteractions(() => {
      closeSheet();
    });
  };

  return (
    <View style={styles.section}>
      <Text variant="label" tone="secondary">
        Organization
      </Text>
      <View style={styles.organizationControls}>
        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [styles.homeButtonShell, pressed && styles.homeButtonPressed]}
        >
          <Card padding="md" style={styles.homeButtonCard}>
            <View style={styles.homeButtonContent}>
              <View style={styles.homeLogoWrap}>
                <Image source={logoSource} style={styles.homeLogo} resizeMode="contain" />
              </View>
              <View style={styles.homeTextWrap}>
                <Text variant="label" numberOfLines={1}>
                  Global home
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  Back to the main workspace
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>

        <OrgSwitcher currentOrgId={currentOrgId} onSelectComplete={closeSheet} />
      </View>
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
  organizationControls: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  homeButtonShell: {
    flex: 0.9,
  },
  homeButtonPressed: {
    opacity: 0.85,
  },
  homeButtonCard: {
    width: "100%",
    minHeight: 68,
  },
  homeButtonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  homeLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
  },
  homeLogo: {
    width: 22,
    height: 22,
  },
  homeTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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