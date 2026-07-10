import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Building2, ListTodo, Network } from "lucide-react-native";
import { useCurrentOrgId } from "../../hooks/use-current-org-id";
import { APP_SHELL_BG } from "../../src/lib/theme";

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

                    router.push(href);
                  }
                : undefined
            }
            style={({ pressed }) => [
              styles.button,
              tab.active && styles.buttonActive,
              pressed && styles.buttonPressed,
              tab.disabled && styles.buttonDisabled,
            ]}
          >
            <tab.icon size={18} strokeWidth={2.1} color={tab.active ? "#1D4ED8" : "#111827"} />
            <Text style={[styles.buttonLabel, tab.active && styles.buttonLabelActive]} numberOfLines={1}>
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
    backgroundColor: APP_SHELL_BG,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: BAR_HEIGHT,
    borderRadius: 28,
    backgroundColor: APP_SHELL_BG,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  button: {
    width: TAB_SIZE,
    height: TAB_SIZE,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  buttonActive: {
    backgroundColor: "#EEF2FF",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonLabel: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 3,
    textAlign: "center",
  },
  buttonLabelActive: {
    color: "#1D4ED8",
  },
});