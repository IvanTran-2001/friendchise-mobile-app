import type { ReactNode } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors, spacing } from "../../src/lib/theme";
import { IconButton } from "./icon-button";
import { Text } from "./text";

type SheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Consistent page-sheet modal used for pickers, switchers, and profile
 * panels. Provides a close button, optional title/subtitle, and safe area
 * handling so every sheet in the app looks and behaves the same way.
 *
 * @example
 * <SheetModal visible={open} onClose={close} title="Switch organization">
 *   {content}
 * </SheetModal>
 */
export function SheetModal({ visible, onClose, title, subtitle, children }: SheetModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}>
            <X size={16} strokeWidth={2.5} color={colors.textPrimary} />
          </IconButton>
          {title ? (
            <View style={styles.titleWrap}>
              <Text variant="heading" align="center" numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="caption" tone="secondary" align="center" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    position: "absolute",
    left: spacing.lg,
    top: spacing.md,
    zIndex: 2,
  },
  titleWrap: {
    alignItems: "center",
    gap: 2,
    paddingTop: spacing.xs,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
});
