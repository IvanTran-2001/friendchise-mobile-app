import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { AppNavbar } from "../../components/layout/app-navbar";
import { AppBottomBar } from "../../components/layout/app-bottom-bar";
import { NavbarProvider } from "../../components/layout/navbar-context";
import { colors } from "../../src/lib/theme";
import { saveLastRoute } from "../../src/features/navigation/last-route-store";
import { SessionWatcher } from "../../src/features/auth/session-watcher";

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
      <RouteTracker />
      <SessionWatcher />
      <View style={styles.container}>
        <AppNavbar />
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false, animation: "none" }} />
        </View>
        <AppBottomBar />
      </View>
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
  },
});