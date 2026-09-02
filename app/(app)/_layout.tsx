import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { NavbarProvider } from "../../components/layout/navbar-context";
import { GlobalSheetProvider } from "../../components/layout/global-sheet";
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
      <GlobalSheetProvider>
        <RouteTracker />
        <SessionWatcher />
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </GlobalSheetProvider>
    </NavbarProvider>
  );
}