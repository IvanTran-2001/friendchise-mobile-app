import { Stack, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { AppNavbar } from "../../components/layout/app-navbar";
import { AppBottomBar } from "../../components/layout/app-bottom-bar";
import { NavbarProvider, useNavbarSetters } from "../../components/layout/navbar-context";
import { APP_SHELL_BG } from "../../src/lib/theme";
import { saveLastRoute } from "../../src/features/navigation/last-route-store";
import { clearAuthToken, getAuthToken } from "../../src/features/auth/token-store";
import { isJwtExpired, getJwtExpiryMs } from "../../src/features/auth/jwt-utils";
import { useAuthStore } from "../../src/features/auth/auth-store";
import { useRouter } from "expo-router";

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
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    const clearExpiryTimer = () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };

    getAuthToken().then((token) => {
      if (!alive) {
        return;
      }

      clearExpiryTimer();

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

      const expiryMs = getJwtExpiryMs(token);
      if (!expiryMs) {
        return;
      }

      const delay = Math.max(expiryMs - Date.now(), 0);
      expiryTimerRef.current = setTimeout(() => {
        void clearAuthToken();
        setAuthenticated(false);
        router.replace("/(auth)/login");
      }, delay);
    });

    return () => {
      alive = false;
      clearExpiryTimer();
    };
  }, [router, setAuthenticated]);

  return null;
}

function NavbarRouteReset() {
  const pathname = usePathname();
  const { setActions } = useNavbarSetters();

  useEffect(() => {
    setActions?.(null);
  }, [pathname, setActions]);

  return null;
}

export default function AppLayout() {
  return (
    <NavbarProvider>
      <RouteTracker />
      <SessionWatcher />
      <NavbarRouteReset />
      <View style={styles.container}>
        <AppNavbar />
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
        </View>
        <AppBottomBar />
      </View>
    </NavbarProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_SHELL_BG,
  },
  content: {
    flex: 1,
    backgroundColor: APP_SHELL_BG,
  },
});