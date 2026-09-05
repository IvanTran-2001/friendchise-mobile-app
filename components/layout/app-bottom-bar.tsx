import { Pressable, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Building2, ChevronLeft, ListTodo, Network, ShieldCheck, User, Users, Wrench } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useCurrentOrgId } from "../../hooks/use-current-org-id";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";
import { Text } from "../ui/text";
import { fetchOrgSettingsPermissions } from "../../src/features/orgs/org-mode/settings/org-settings-permissions";
import { fetchNotificationFeed } from "../../src/features/notifications/notifications-api";

const BAR_HEIGHT = 72;
const TAB_SIZE = 52;

export function AppBottomBar() {
  const router = useRouter();
  const currentOrgId = useCurrentOrgId();
  const pathname = usePathname();
  const shellMode = getShellMode(pathname, currentOrgId);
  const { data: settingsPermissions } = useQuery({
    queryKey: ["mobile-org-settings-permissions", currentOrgId],
    queryFn: () => fetchOrgSettingsPermissions(currentOrgId ?? ""),
    enabled: shellMode === "settings" && Boolean(currentOrgId),
  });
  const { data: notificationSummary } = useQuery({
    queryKey: ["mobile-notifications", "summary"],
    queryFn: () => fetchNotificationFeed(1, 1, "all"),
    enabled: shellMode === "global",
    retry: false,
    staleTime: 30_000,
  });
  const notificationCount = notificationSummary?.unseenCount ?? 0;
  const tabs =
    shellMode === "org" && currentOrgId
      ? getOrgTabs(currentOrgId, pathname)
      : shellMode === "settings" && currentOrgId
        ? getSettingsTabs(currentOrgId, pathname, settingsPermissions ?? null)
        : getGlobalTabs(pathname, notificationCount);

  if (shellMode === "none") {
    return null;
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.bar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.label}
            disabled={tab.disabled}
            onPress={
              tab.onPress
                ? tab.onPress
                : tab.href
                  ? () => {
                      const href = tab.href;

                      if (!href) {
                        return;
                      }

                      router.replace(href);
                    }
                  : tab.label === "ORG"
                    ? () => {
                        router.replace("/");
                      }
                    : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: tab.active, disabled: tab.disabled }}
            style={({ pressed }) => [
              styles.button,
              tab.active && styles.buttonActive,
              pressed && styles.buttonPressed,
              tab.disabled && styles.buttonDisabled,
            ]}
          >
            <tab.icon
              size={18}
              strokeWidth={2.1}
              color={tab.active ? colors.accent : colors.textPrimary}
            />
            {typeof tab.badge === "number" && tab.badge > 0 ? (
              <View style={styles.badge}>
                <Text variant="label" style={styles.badgeLabel} numberOfLines={1}>
                  {tab.badge > 99 ? "99+" : String(tab.badge)}
                </Text>
              </View>
            ) : null}
            <Text
              variant="label"
              style={[styles.buttonLabel, tab.active && styles.buttonLabelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

type BottomTab = {
  label: string;
  icon: typeof Building2;
  active?: boolean;
  disabled?: boolean;
  href?: string;
  onPress?: () => void;
  badge?: number;
};

type ShellMode = "global" | "org" | "settings" | "none";
type SettingsPermissions = {
  canManageOrgSettings: boolean;
  canManageRoles: boolean;
  canManageSettings: boolean;
};

function getShellMode(pathname: string, currentOrgId: string | null): ShellMode {
  if (isAuthRoute(pathname)) {
    return "none";
  }

  if (currentOrgId && pathname.startsWith(`/orgs/${currentOrgId}/settings`)) {
    return "settings";
  }

  if (currentOrgId && pathname.startsWith(`/orgs/${currentOrgId}`)) {
    return "org";
  }

  return "global";
}

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/(auth)") || pathname.startsWith("/signin");
}

function getGlobalTabs(pathname: string, notificationCount: number): BottomTab[] {
  const isOrgHubRoute =
    pathname === "/orgs" || pathname === "/orgs/new" || pathname === "/orgs/invite" || pathname === "/orgs/invites";

  return [
    { label: "HUB", icon: Building2, active: pathname === "/", href: "/" },
    { label: "ORG", icon: Network, active: isOrgHubRoute, href: "/orgs" },
    { label: "NOTIF", icon: Bell, active: pathname === "/notifications", href: "/notifications", badge: notificationCount },
  ];
}

function getOrgTabs(currentOrgId: string, pathname: string): BottomTab[] {
  const orgRouteBase = `/orgs/${currentOrgId}`;
  const appOrgRouteBase = `/(app)/orgs/${currentOrgId}`;
  const isHomeRoute = pathname === orgRouteBase;
  const isTasksRoute = pathname === `${orgRouteBase}/tasks` || pathname.startsWith(`${orgRouteBase}/tasks/`);
  const isMembersRoute = pathname === `${orgRouteBase}/members` || pathname.startsWith(`${orgRouteBase}/members/`);
  const isToolsRoute = pathname === `${orgRouteBase}/tools` || pathname.startsWith(`${orgRouteBase}/tools/`);

  return [
    {
      label: "Home",
      icon: Building2,
      active: isHomeRoute,
      href: appOrgRouteBase,
    },
    {
      label: "Tasks",
      icon: ListTodo,
      active: isTasksRoute,
      href: `${appOrgRouteBase}/tasks`,
    },
    {
      label: "Members",
      icon: Users,
      active: isMembersRoute,
      href: `${appOrgRouteBase}/members`,
    },
    {
      label: "Tools",
      icon: Wrench,
      active: isToolsRoute,
      href: `${appOrgRouteBase}/tools`,
    },
  ];
}

function getSettingsTabs(
  currentOrgId: string,
  pathname: string,
  permissions: SettingsPermissions | null,
): BottomTab[] {
  const settingsRouteBase = `/orgs/${currentOrgId}/settings`;
  const appSettingsRouteBase = `/(app)/orgs/${currentOrgId}/settings`;
  const canManageOrgSettings = permissions?.canManageOrgSettings ?? false;
  const canManageRoles = permissions?.canManageRoles ?? false;

  const tabs: BottomTab[] = [
    {
      label: "BACK",
      icon: ChevronLeft,
      href: `/(app)/orgs/${currentOrgId}`,
    },
    ...(
      canManageOrgSettings
        ? [
            {
              label: "ORG",
              icon: Building2,
              active: pathname === `${settingsRouteBase}/organization`,
              href: `${appSettingsRouteBase}/organization`,
            },
          ]
        : []
    ),
    ...(
      canManageRoles
        ? [
            {
              label: "ROLES",
              icon: ShieldCheck,
              active: pathname === `${settingsRouteBase}/roles`,
              href: `${appSettingsRouteBase}/roles`,
            },
          ]
        : []
    ),
    {
      label: "USER",
      icon: User,
      active: pathname === settingsRouteBase,
      href: appSettingsRouteBase,
    },
  ];

  return tabs;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm + 2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    height: BAR_HEIGHT,
    borderRadius: radius.xxl + 2,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.md,
  },
  button: {
    width: TAB_SIZE,
    height: TAB_SIZE,
    borderRadius: radius.xl - 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  buttonActive: {
    backgroundColor: colors.accentSoft,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonLabel: {
    color: colors.textSecondary,
    marginTop: 3,
    textAlign: "center",
    textTransform: "none",
    letterSpacing: 0.2,
  },
  buttonLabelActive: {
    color: colors.accent,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  badgeLabel: {
    color: colors.textInverse,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0,
  },
});