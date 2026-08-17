import { ActivityIndicator, StyleSheet } from "react-native";
import { useAuthCallbackState } from "../../src/features/auth/auth-callback";
import { Screen } from "../../components/ui/screen";
import { Text } from "../../components/ui/text";
import { colors, spacing } from "../../src/lib/theme";

export default function AuthCallbackScreen() {
  const { message, hasError } = useAuthCallbackState();

  return (
    <Screen edges={["top", "bottom"]} centered>
      <Text variant="title" align="center" style={styles.title}>
        Friendchise
      </Text>
      {!hasError ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}
      <Text variant="body" tone={hasError ? "danger" : "secondary"} align="center" style={styles.message}>
        {message}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    maxWidth: 320,
  },
});