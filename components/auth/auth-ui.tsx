import { FontAwesome5 } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

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
    backgroundColor: "#FFFFFF",
    iconBackgroundColor: "#E2E8F0",
    iconColor: "#0B1220",
    textColor: "#05110A",
    iconName: "google" as const,
  },
  linkedin: {
    backgroundColor: "#EEF2FF",
    iconBackgroundColor: "rgba(37, 99, 235, 0.12)",
    iconColor: "#1D4ED8",
    textColor: "#1E293B",
    iconName: "linkedin-in" as const,
  },
} satisfies Record<Provider, {
  backgroundColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  textColor: string;
  iconName: React.ComponentProps<typeof FontAwesome5>["name"];
}>;

export function AuthCard({ children, style }: AuthCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AuthProviderButton({
  provider,
  label,
  loadingLabel,
  onPress,
  disabled,
}: AuthProviderButtonProps) {
  const config = providerStyles[provider];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: config.backgroundColor },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "#FFFFFF",
    padding: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
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
    gap: 10,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});