import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from "react-native";
import { colors, typography } from "../../src/lib/theme";

export type TextVariant = keyof typeof typography;
export type TextTone = keyof typeof toneColors;

const toneColors = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  inverse: colors.textInverse,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
} as const;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  align?: "auto" | "left" | "right" | "center" | "justify";
};

/**
 * Typography primitive. Use this instead of React Native's `Text` so every
 * screen shares the same font sizes, weights, and line heights.
 *
 * @example <Text variant="title">Organization</Text>
 * @example <Text variant="caption" tone="secondary">Updated 2m ago</Text>
 */
export function Text({ variant = "body", tone = "primary", align, style, ...rest }: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        typography[variant] as object,
        { color: toneColors[tone] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: undefined,
  },
});
