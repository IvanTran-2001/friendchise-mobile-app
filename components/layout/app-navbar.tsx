import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileOrgButton } from "./profile-panel/index";
import { useNavbarActions } from "./navbar-context";
import { DemoModeIndicator } from "../../src/features/auth/demo-session-banner";
import { colors, radius, spacing } from "../../src/lib/theme";

export function AppNavbar() {
  const pageActions = useNavbarActions();
  const renderedActions = typeof pageActions === "function" ? pageActions() : pageActions;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.demoIndicatorWrap} pointerEvents="none">
          <DemoModeIndicator />
        </View>
        <ProfileOrgButton />
        <View style={styles.pageActionsWrap}>{renderedActions}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  container: {
    height: 68,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  // Floats above the profile button without affecting layout height or
  // covering the button/page actions beneath it.
  demoIndicatorWrap: {
    position: "absolute",
    left: spacing.sm + 2,
    top: -10,
    zIndex: 10,
  },
  pageActionsWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "stretch",
    justifyContent: "center",
  },
});