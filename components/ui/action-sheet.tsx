import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../../src/lib/theme";
import { SheetModal } from "./sheet-modal";
import { Text } from "./text";

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type ActionSheetSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Reusable bottom-sheet shell for grouped controls like filters, sorters,
 * and view toggles. Keep task-specific content inside the sections, and reuse
 * this shell for any future action panels that need the same mobile pattern.
 */
export function ActionSheet({ visible, onClose, onDismiss, title, subtitle, children }: ActionSheetProps) {
  return (
    <SheetModal visible={visible} onClose={onClose} onDismiss={onDismiss} title={title} subtitle={subtitle}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SheetModal>
  );
}

/**
 * Section wrapper for action sheets. It standardizes spacing and headings so
 * controls read consistently across different sheets.
 */
export function ActionSheetSection({ title, subtitle, children }: ActionSheetSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="label" tone="secondary">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary" align="right" style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionSubtitle: {
    flex: 1,
    color: colors.textTertiary,
  },
  sectionBody: {
    gap: spacing.sm,
  },
});
