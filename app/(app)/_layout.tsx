import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { NavbarProvider } from "../../components/layout/navbar-context";
import { GlobalSheetProvider } from "../../components/layout/global-sheet";
import { AppNavbar } from "../../components/layout/app-navbar";
import { AppBottomBar } from "../../components/layout/app-bottom-bar";
import { saveLastRoute } from "../../src/features/navigation/last-route-store";
import { SessionWatcher } from "../../src/features/auth/session-watcher";
import { colors, spacing } from "../../src/lib/theme";

function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !pathname.startsWith("/")) {
      return;
    }

    void saveLastRoute(pathname === "/" ? "/(app)" : pathname);
  }, [pathname]);

  return null;
}

export default function AppLayout() {
  return (
    <NavbarProvider>
      <GlobalSheetProvider>
        <View style={styles.container}>
          <RouteTracker />
          <SessionWatcher />
          <AppNavbar />
          <View style={styles.content}>
            <Stack screenOptions={{ headerShown: false, animation: "none" }} />
          </View>
          <AppBottomBar />
        </View>
      </GlobalSheetProvider>
    </NavbarProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
  },
});