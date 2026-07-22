import { FontAwesome5 } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Card } from "../ui/card";
import { Text } from "../ui/text";

type Provider = "google" | "linkedin";

type AuthCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type AuthProviderButtonProps = {
  provider: Provider;
  label: string;
  loadingLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

const providerStyles = {
  google: {
    backgroundColor: colors.surface,
    iconBackgroundColor: colors.surfaceMuted,
    iconColor: colors.dark,
    textColor: colors.textPrimary,
    iconName: "google" as const,
  },
  linkedin: {
    backgroundColor: colors.accentSoft,
    iconBackgroundColor: "rgba(37, 99, 235, 0.12)",
    iconColor: colors.accent,
    textColor: colors.textPrimary,
    iconName: "linkedin-in" as const,
  },
} satisfies Record<
  Provider,
  {
    backgroundColor: string;
    iconBackgroundColor: string;
    iconColor: string;
    textColor: string;
    iconName: React.ComponentProps<typeof FontAwesome5>["name"];
  }
>;

/** Elevated card wrapper used for the sign-in card and dev-tools panel. */
export function AuthCard({ children, style }: AuthCardProps) {
  return (
    <Card padding="lg" elevation="lg" style={[styles.card, style]}>
      {children}
    </Card>
  );
}

/** Branded social sign-in button (Google / LinkedIn). */
export function AuthProviderButton({ provider, label, loadingLabel, onPress, disabled }: AuthProviderButtonProps) {
  const config = providerStyles[provider];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: config.backgroundColor },
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.buttonContent}>
        <View style={[styles.iconWrap, { backgroundColor: config.iconBackgroundColor }]}>
          <FontAwesome5 name={config.iconName} size={15} color={config.iconColor} brand />
        </View>
        <Text style={[styles.buttonText, { color: config.textColor }]}>
          {disabled ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});