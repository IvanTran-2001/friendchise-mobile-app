import { StyleSheet, View } from "react-native";
import { spacing } from "../../src/lib/theme";
import { Text } from "./text";

type ScreenHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
};

/**
 * Consistent kicker + title + subtitle block used at the top of most
 * screens (organization pages, tasks, settings, etc.).
 *
 * @example <ScreenHeader kicker="Organization" title="Choose your organization" subtitle="Select one to continue." />
 */
export function ScreenHeader({ kicker, title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {kicker ? (
        <Text variant="label" tone="accent" style={styles.kicker}>
          {kicker}
        </Text>
      ) : null}
      <Text variant="title">{title}</Text>
      {subtitle ? (
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  kicker: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
