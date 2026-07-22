import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { colors, radius, spacing } from "../../src/lib/theme";
import { Avatar, getInitials } from "./avatar";
import { ListRow } from "./list-row";
import { SearchField } from "./search-field";
import { SheetModal } from "./sheet-modal";
import { Text } from "./text";

export type SearchableComboboxItem = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
};

type SearchableComboboxProps = {
  items: SearchableComboboxItem[];
  onSelect: (item: SearchableComboboxItem) => void;
  triggerLabel: string;
  triggerValue?: string | null;
  triggerImageUri?: string | null;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

/**
 * Generic searchable list picker: a trigger row that opens a search sheet.
 * Use for forms that need to pick one item out of many (assignees,
 * categories, locations, etc.).
 *
 * @example
 * <SearchableCombobox
 *   items={members}
 *   triggerLabel="Assignee"
 *   triggerValue={selected?.name}
 *   onSelect={(item) => setSelected(item)}
 * />
 */
export function SearchableCombobox({
  items,
  onSelect,
  triggerLabel,
  triggerValue,
  triggerImageUri,
  placeholder = "Search…",
  emptyText = "No results",
  disabled,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false),
    );
  }, [items, search]);

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
        <Avatar imageUri={triggerImageUri} label={getInitials(triggerValue ?? triggerLabel)} size="sm" />
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

      <SheetModal visible={open} onClose={closeSheet} title={triggerLabel}>
        <SearchField
          autoFocusOnMount
          value={search}
          onChangeText={setSearch}
          placeholder={placeholder}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text variant="body" tone="secondary" align="center" style={styles.emptyText}>
              {emptyText}
            </Text>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={item.description ?? undefined}
              leading={<Avatar imageUri={item.image} label={getInitials(item.name)} size="sm" />}
              onPress={() => {
                closeSheet();
                onSelect(item);
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
  list: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyText: {
    paddingVertical: spacing.xxl,
  },
});
