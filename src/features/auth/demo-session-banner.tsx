import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { Text } from "../../../components/ui/text";
import { colors, radius, spacing } from "../../lib/theme";
import { useAuthStore } from "./auth-store";

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Compact "Demo Mode" pill (icon + live countdown) shown for demo sessions.
 * Rendered by `AppNavbar` as an absolutely positioned overlay near the
 * profile button so it never takes up layout space. Ending the demo early
 * is still available from the profile sheet.
 */
export function DemoModeIndicator() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoExpiresAt = useAuthStore((state) => state.demoExpiresAt);
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
    <View style={styles.pill} pointerEvents="none">
      <Sparkles size={12} color={colors.accent} />
      <Text variant="captionStrong" tone="accent" numberOfLines={1}>
        {formatRemaining(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
  },
});
