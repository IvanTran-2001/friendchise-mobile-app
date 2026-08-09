import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { AppNavbar } from "../../components/layout/app-navbar";
import { AppBottomBar } from "../../components/layout/app-bottom-bar";
import { NavbarProvider } from "../../components/layout/navbar-context";
import { colors } from "../../src/lib/theme";
import { saveLastRoute } from "../../src/features/navigation/last-route-store";
import { clearAuthToken, getAuthToken } from "../../src/features/auth/token-store";
import { isJwtExpired } from "../../src/features/auth/jwt-utils";
import { useAuthStore } from "../../src/features/auth/auth-store";

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

function SessionWatcher() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let alive = true;

    getAuthToken().then((token) => {
      if (!alive) {
        return;
      }

      if (!token) {
        setAuthenticated(false);
        return;
      }

      if (isJwtExpired(token)) {
        void clearAuthToken();
        setAuthenticated(false);
        router.replace("/(auth)/login");
        return;
      }

      setAuthenticated(true);
    }).catch(() => {
      if (!alive) {
        return;
      }

      setAuthenticated(false);
      router.replace("/(auth)/login");
    });

    return () => {
      alive = false;
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [hasHydrated, router, setAuthenticated]);

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