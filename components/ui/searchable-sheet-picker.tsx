import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Avatar, getInitials } from "./avatar";
import { SearchField } from "./search-field";
import { SheetModal } from "./sheet-modal";
import { Text } from "./text";

type SearchableSheetPickerProps = {
  title: string;
  triggerLabel: string;
  triggerValue?: string | null;
  placeholder?: string;
  disabled?: boolean;
  children: (helpers: { search: string; closeSheet: () => void }) => ReactNode;
};

export function SearchableSheetPicker({
  title,
  triggerLabel,
  triggerValue,
  placeholder = "Search…",
  disabled,
  children,
}: SearchableSheetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const closeSheet = () => {
    setOpen(false);
    setSearch("");
  };

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
        <Avatar label={getInitials(triggerValue ?? triggerLabel)} size="sm" />
        <View style={styles.triggerTextWrap}>
          <Text variant="label" tone="secondary">
            {triggerLabel}
          </Text>
          <Text variant="bodyStrong" numberOfLines={1}>
            {triggerValue || "Select one"}
          </Text>
        </View>
        <ChevronDown size={18} strokeWidth={2.2} color={colors.textTertiary} />
      </Pressable>

      <SheetModal visible={open} onClose={closeSheet} title={title}>
        <SearchField autoFocusOnMount value={search} onChangeText={setSearch} placeholder={placeholder} />
        {children({ search, closeSheet })}
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
});