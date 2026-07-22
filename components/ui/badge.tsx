import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Text } from "./text";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  dotted?: boolean;
  dotColor?: string;
};

const toneStyles: Record<BadgeTone, { background: string; text: string; border: string; dot: string }> = {
  neutral: {
    background: colors.surfaceMuted,
    text: colors.textSecondary,
    border: colors.border,
    dot: colors.textTertiary,
  },
  accent: {
    background: colors.accentSoft,
    text: colors.accent,
    border: colors.accentSoftBorder,
    dot: colors.accent,
  },
  success: {
    background: colors.successSoft,
    text: colors.success,
    border: colors.successBorder,
    dot: colors.success,
  },
  warning: {
    background: colors.warningSoft,
    text: colors.warning,
    border: colors.warningBorder,
    dot: colors.warning,
  },
  danger: {
    background: colors.dangerSoft,
    text: colors.danger,
    border: colors.dangerBorder,
    dot: colors.danger,
  },
};

/**
 * Small status pill used for task status, org labels, and other short tags.
 *
 * @example <Badge label="In progress" tone="accent" dotted />
 */
export function Badge({ label, tone = "neutral", dotted, dotColor }: BadgeProps) {
  const palette = toneStyles[tone];

  return (
    <View style={[styles.container, { backgroundColor: palette.background, borderColor: palette.border }]}>
      {dotted ? <View style={[styles.dot, { backgroundColor: dotColor ?? palette.dot }]} /> : null}
      <Text variant="label" style={{ color: palette.text }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: "100%",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
});
