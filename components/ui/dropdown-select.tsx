import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { ListRow } from "./list-row";
import { SheetModal } from "./sheet-modal";
import { Text } from "./text";

export type DropdownSelectItem = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
};

type DropdownSelectProps = {
  label: string;
  selectedId: string;
  items: DropdownSelectItem[];
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
};

/**
 * Reusable mobile dropdown/select control. Use this for single-choice options
 * such as sort, mode, and view so the trigger + list behavior stays consistent.
 */
export function DropdownSelect({
  label,
  selectedId,
  items,
  onSelect,
  placeholder = "Select one",
  disabled,
  helperText,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const closeSheet = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          pressed && !disabled ? styles.triggerPressed : null,
          disabled ? styles.triggerDisabled : null,
        ]}
      >
        <View style={styles.triggerTextWrap}>
          <Text variant="label" tone="secondary">
            {label}
          </Text>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.selectedText}>
            {selectedItem?.name ?? placeholder}
          </Text>
          {helperText ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {helperText}
            </Text>
          ) : null}
        </View>
        <ChevronDown size={18} strokeWidth={2.2} color={colors.textTertiary} />
      </Pressable>

      <SheetModal visible={open} onClose={closeSheet} title={label} subtitle="Choose one option">
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={item.description ?? undefined}
              leading={item.color ? <View style={[styles.dot, { backgroundColor: item.color }]} /> : undefined}
              trailing={item.id === selectedId ? <Check size={18} strokeWidth={2.4} color={colors.accent} /> : null}
              onPress={() => {
                onSelect(item.id);
                closeSheet();
              }}
            />
          )}
        />
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  selectedText: {
    flex: 1,
  },
  list: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
});
