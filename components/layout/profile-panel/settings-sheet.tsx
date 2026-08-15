import { StyleSheet, View } from "react-native";
import { Text } from "../../ui/text";
import { colors, radius, spacing } from "../../../src/lib/theme";

export function SettingsSheet() {
  return (
    <View style={styles.body}>
      <View style={styles.card}>
        <Text variant="bodyStrong">Settings panel</Text>
        <Text variant="caption" tone="secondary">
          Add settings controls here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  card: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
});