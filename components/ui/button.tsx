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
export type ButtonSize = "sm" | "md" | "lg";

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
  // 44 is the minimum comfortable, accessible tap target (see minTapTarget).
  sm: { height: minTapTarget, paddingHorizontal: spacing.lg, fontSize: 13 },
  md: { height: 50, paddingHorizontal: spacing.xl, fontSize: 15 },
  lg: { height: 56, paddingHorizontal: spacing.xxl, fontSize: 16 },
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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
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
