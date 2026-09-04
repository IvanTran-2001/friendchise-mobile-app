import { FontAwesome5 } from "@expo/vector-icons";
import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from "expo-apple-authentication";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Card } from "../ui/card";
import { Text } from "../ui/text";

type Provider = "apple" | "google" | "linkedin";

type AuthCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type AuthProviderButtonProps = {
  provider: Provider;
  label: string;
  loadingLabel: string;
  onPress: () => void;
  appleFallbackOnPress?: () => void;
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
  apple: {
    backgroundColor: colors.dark,
    iconBackgroundColor: "rgba(255,255,255,0.12)",
    iconColor: colors.background,
    textColor: colors.background,
    iconName: "apple" as const,
  },
  linkedin: {
    backgroundColor: colors.surface,
    iconBackgroundColor: colors.surfaceMuted,
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
    <Card padding="lg" elevation="md" style={[styles.card, style]}>
      {children}
    </Card>
  );
}

/** Branded social sign-in button (Apple / Google / LinkedIn). */
export function AuthProviderButton({ provider, label, loadingLabel, onPress, appleFallbackOnPress, disabled }: AuthProviderButtonProps) {
  const config = providerStyles[provider];
  const appleAvailable = useAppleAuthenticationAvailability(provider);

  if (provider === "apple" && Platform.OS === "ios" && appleAvailable) {
    return (
      <AppleAuthenticationButton
        buttonType={AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={radius.lg}
        style={[styles.appleButton, disabled && styles.buttonDisabled]}
        onPress={disabled ? () => {} : onPress}
      />
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: config.backgroundColor },
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={provider === "apple" && Platform.OS === "ios" ? (appleFallbackOnPress ?? onPress) : onPress}
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

function useAppleAuthenticationAvailability(provider: Provider) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (provider !== "apple" || Platform.OS !== "ios") {
      setAvailable(null);
      return () => {
        cancelled = true;
      };
    }

    void import("expo-apple-authentication")
      .then((appleAuthentication) => appleAuthentication.isAvailableAsync())
      .then((result) => {
        if (!cancelled) {
          setAvailable(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provider]);

  return available;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  button: {
    minHeight: 50,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  appleButton: {
    width: "100%",
    height: 50,
    marginTop: spacing.xs,
  },
  buttonContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.1,
  },
});