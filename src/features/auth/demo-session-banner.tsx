import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sparkles, X } from "lucide-react-native";
import { Text } from "../../../components/ui/text";
import { IconButton } from "../../../components/ui/icon-button";
import { colors, radius, spacing } from "../../lib/theme";
import { useAuthStore } from "./auth-store";
import { clearSessionAndRedirect } from "./logout";

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Persistent status strip shown only for demo sessions, mirroring the web
 * app's demo banner (`components/layout/demo-tour/components/demo-banner.tsx`).
 * Shows a live countdown to token expiry and lets the visitor end the demo
 * early. Auto sign-out at expiry is handled separately by `SessionWatcher`.
 */
export function DemoSessionBanner() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoExpiresAt = useAuthStore((state) => state.demoExpiresAt);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setSessionExpiresAt = useAuthStore((state) => state.setSessionExpiresAt);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);
  const [remaining, setRemaining] = useState(() => (demoExpiresAt ? demoExpiresAt - Date.now() : 0));

  useEffect(() => {
    if (!demoExpiresAt) {
      return;
    }

    setRemaining(demoExpiresAt - Date.now());
    const id = setInterval(() => {
      setRemaining(demoExpiresAt - Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, [demoExpiresAt]);

  if (!isDemo) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.info}>
        <View style={styles.iconWrap}>
          <Sparkles size={13} color={colors.warning} />
        </View>
        <Text variant="captionStrong" tone="warning" numberOfLines={1}>
          Demo session
        </Text>
        <Text variant="caption" tone="warning" numberOfLines={1} style={styles.timer}>
          Ends in {formatRemaining(remaining)}
        </Text>
      </View>
      <IconButton
        size="sm"
        variant="ghost"
        accessibilityLabel="End demo session"
        onPress={() => {
          void clearSessionAndRedirect({ queryClient, setAuthenticated, setSessionExpiresAt, setDemoSession, router });
        }}
      >
        <X size={16} color={colors.warning} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warningBorder,
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(180, 83, 9, 0.14)",
  },
  timer: {
    marginLeft: spacing.xs,
    opacity: 0.85,
  },
});
