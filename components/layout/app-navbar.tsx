import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileOrgButton } from "./profile-panel/index";
import { useNavbarActions } from "./navbar-context";
import { colors, radius, spacing } from "../../src/lib/theme";

export function AppNavbar() {
  const pageActions = useNavbarActions();
  const renderedActions = typeof pageActions === "function" ? pageActions() : pageActions;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
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
  pageActionsWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "stretch",
    justifyContent: "center",
  },
});