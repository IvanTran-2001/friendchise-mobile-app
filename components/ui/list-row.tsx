import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronRight, Check } from "lucide-react-native";
import { colors, minTapTarget, spacing } from "../../src/lib/theme";
import { Text } from "./text";

type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: "chevron" | "check" | ReactNode | null;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable list row with an optional leading element (avatar/icon), title,
 * subtitle, and trailing indicator. Used for organization lists, pickers,
 * and settings-style rows.
 *
 * @example <ListRow leading={<Avatar .../>} title={org.name} subtitle="Organization" trailing="chevron" onPress={...} />
 */
export function ListRow({ title, subtitle, leading, trailing, onPress, disabled, style }: ListRowProps) {
  const trailingContent =
    trailing === "chevron" ? (
      <ChevronRight size={18} strokeWidth={2.2} color={colors.textTertiary} />
    ) : trailing === "check" ? (
      <Check size={18} strokeWidth={2.4} color={colors.accent} />
    ) : (
      trailing ?? null
    );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.textWrap}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailingContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: minTapTarget,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  leading: {
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: 2,
  },
});
