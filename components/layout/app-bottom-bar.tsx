import { Pressable, StyleSheet, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Building2, ListTodo, Network } from "lucide-react-native";
import { useCurrentOrgId } from "../../hooks/use-current-org-id";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";
import { Text } from "../ui/text";

const BAR_HEIGHT = 72;
const TAB_SIZE = 52;

export function AppBottomBar() {
  const router = useRouter();
  const currentOrgId = useCurrentOrgId();
  const segments = useSegments();
  const routeSegments = segments as unknown as string[];
  const tabs = currentOrgId
    ? getOrgTabs(currentOrgId, routeSegments)
    : getNonOrgTabs();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.bar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.label}
            disabled={tab.disabled}
            onPress={
              tab.href
                ? () => {
                    const href = tab.href;

                    if (!href) {
                      return;
                    }

                    router.replace(href);
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
};

function getNonOrgTabs(): BottomTab[] {
  return [
    { label: "HUB", icon: Building2, active: true, disabled: true },
    { label: "ORG", icon: Network, disabled: true },
    { label: "NOTIF", icon: Bell, disabled: true },
  ];
}

function getOrgTabs(currentOrgId: string, routeSegments: string[]): BottomTab[] {
  const isTasksRoute = routeSegments.includes("tasks");
  const orgHomeHref = `/(app)/orgs/${currentOrgId}`;
  const tasksHref = `/(app)/orgs/${currentOrgId}/tasks`;

  return [
    {
      label: "Home",
      icon: Building2,
      active: !isTasksRoute,
      href: orgHomeHref,
    },
    {
      label: "Tasks",
      icon: ListTodo,
      active: isTasksRoute,
      href: tasksHref,
    },
  ];
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
});