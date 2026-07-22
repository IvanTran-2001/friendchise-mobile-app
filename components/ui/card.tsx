import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";

type CardPadding = "none" | "sm" | "md" | "lg";
type CardElevation = "none" | "xs" | "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  padding?: CardPadding;
  elevation?: CardElevation;
  style?: StyleProp<ViewStyle>;
};

const paddingValues: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

/**
 * Base surface primitive for grouped content. Every card in the app should
 * come from here so radius, border, and shadow stay consistent.
 *
 * @example <Card padding="md">{children}</Card>
 */
export function Card({ children, padding = "none", elevation = "sm", style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding: paddingValues[padding] },
        elevation !== "none" ? shadows[elevation] : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
