import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, hitSlop } from "../../src/lib/theme";

type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  size?: IconButtonSize;
  variant?: "filled" | "muted" | "ghost";
  disabled?: boolean;
  accessibilityLabel: string;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
};

const sizes: Record<IconButtonSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

/**
 * Circular tap target for icon-only actions (close buttons, panel toggles).
 * Always requires an `accessibilityLabel` since there is no visible text.
 */
export function IconButton({
  children,
  onPress,
  size = "md",
  variant = "muted",
  disabled,
  accessibilityLabel,
  badge,
  style,
}: IconButtonProps) {
  const dimension = sizes[size];
  const showBadge = typeof badge === "number" ? badge > 0 : badge;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={showBadge ? "Has active task preferences." : undefined}
      style={({ pressed }) => [
        styles.shell,
        styles.base,
        variant === "filled" && styles.filled,
        variant === "muted" && styles.muted,
        variant === "ghost" && styles.ghost,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
      {showBadge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  shell: {
    position: "relative",
  },
  filled: {
    backgroundColor: colors.accent,
  },
  muted: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.accent,
  },
});
