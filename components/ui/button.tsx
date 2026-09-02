import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, minTapTarget, radius, spacing } from "../../src/lib/theme";
import { Text } from "./text";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  // Keep the compact visual size, then expand the hit area back to 44pt below.
  xs: { height: 38, paddingHorizontal: spacing.md, fontSize: 11 },
  sm: { height: minTapTarget, paddingHorizontal: spacing.lg, fontSize: 12 },
  md: { height: 50, paddingHorizontal: spacing.xl, fontSize: 14 },
  lg: { height: 56, paddingHorizontal: spacing.xxl, fontSize: 15 },
};

const variantStyles: Record<
  ButtonVariant,
  { background: string; border: string; text: string; pressedBackground: string }
> = {
  primary: {
    background: colors.accent,
    border: colors.accent,
    text: colors.textInverse,
    pressedBackground: colors.accentStrong,
  },
  secondary: {
    background: colors.accentSoft,
    border: colors.accentSoftBorder,
    text: colors.accent,
    pressedBackground: colors.accentSoftBorder,
  },
  outline: {
    background: colors.surface,
    border: colors.borderStrong,
    text: colors.textPrimary,
    pressedBackground: colors.surfaceMuted,
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: colors.textPrimary,
    pressedBackground: colors.surfaceMuted,
  },
  danger: {
    background: colors.dangerSoft,
    border: colors.dangerBorder,
    text: colors.danger,
    pressedBackground: colors.dangerBorder,
  },
};

/**
 * Primary action primitive for the whole app. Prefer this over ad-hoc
 * `Pressable` + `Text` combinations so buttons stay visually consistent.
 *
 * @example <Button label="Continue" onPress={submit} />
 * @example <Button label="Delete" variant="danger" size="sm" onPress={remove} />
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  loadingLabel,
  fullWidth,
  leftIcon,
  rightIcon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const dims = sizeStyles[size];
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;
  const labelText = loading ? loadingLabel ?? label : label;
  const hitSlop =
    size === "xs"
      ? {
          top: (minTapTarget - dims.height) / 2,
          bottom: (minTapTarget - dims.height) / 2,
          left: (minTapTarget - dims.height) / 2,
          right: (minTapTarget - dims.height) / 2,
        }
      : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? labelText}
      accessibilityState={{ disabled: isDisabled, busy: loading ?? false }}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.paddingHorizontal,
          backgroundColor: pressed && !isDisabled ? palette.pressedBackground : palette.background,
          borderColor: palette.border,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={palette.text} /> : leftIcon}
        <Text style={[styles.label, { color: palette.text, fontSize: dims.fontSize }]} numberOfLines={1}>
          {labelText}
        </Text>
        {!loading ? rightIcon : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  label: {
    fontWeight: "700",
  },
});
