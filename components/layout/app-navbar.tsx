import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileOrgButton } from "./profile-panel";
import { useNavbarActions } from "./navbar-context";
import { APP_SHELL_BG } from "../../src/lib/theme";

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
    backgroundColor: APP_SHELL_BG,
  },
  container: {
    height: 68,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 26,
    backgroundColor: APP_SHELL_BG,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pageActionsWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "stretch",
    justifyContent: "center",
  },
});