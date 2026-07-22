import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Button } from "./button";
import { Text } from "./text";

type LoadingStateProps = {
  message?: string;
  compact?: boolean;
};

/** Inline spinner + message for loading lists or screens. */
export function LoadingState({ message = "Loading...", compact }: LoadingStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ActivityIndicator color={colors.accent} />
      <Text variant="body" tone="secondary" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
};

/** Inline error card with an optional retry action. */
export function ErrorState({
  title = "Something went wrong",
  message = "Please check your connection and try again.",
  onRetry,
  compact,
}: ErrorStateProps) {
  return (
    <View style={[styles.errorContainer, compact && styles.compact]}>
      <View style={styles.errorIconWrap}>
        <AlertTriangle size={20} strokeWidth={2.2} color={colors.danger} />
      </View>
      <Text variant="bodyStrong" align="center">
        {title}
      </Text>
      <Text variant="caption" tone="secondary" align="center" style={styles.message}>
        {message}
      </Text>
      {onRetry ? (
        <Button label="Retry" onPress={onRetry} variant="secondary" size="sm" style={styles.retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  message: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  errorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  retry: {
    marginTop: spacing.md,
  },
});
