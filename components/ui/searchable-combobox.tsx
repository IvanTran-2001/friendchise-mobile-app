import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type SearchableComboboxItem = {
  id: string;
  name: string;
  description?: string | null;
};

type SearchableComboboxProps = {
  items: SearchableComboboxItem[];
  onSelect: (item: SearchableComboboxItem) => void;
  triggerLabel: string;
  triggerValue?: string | null;
  triggerBadgeLabel?: string | null;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

export function SearchableCombobox({
  items,
  onSelect,
  triggerLabel,
  triggerValue,
  triggerBadgeLabel,
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
        {triggerBadgeLabel ? (
          <View style={styles.triggerBadge}>
            <Text style={styles.triggerBadgeText}>{triggerBadgeLabel}</Text>
          </View>
        ) : null}
        <View style={styles.triggerTextWrap}>
          <Text style={styles.triggerLabel}>{triggerLabel}</Text>
          <Text style={styles.triggerValue} numberOfLines={1}>
            {triggerValue || "Select one"}
          </Text>
        </View>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>{triggerLabel}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Text style={styles.closeButton}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder={placeholder}
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  pressed ? styles.itemPressed : null,
                ]}
                onPress={() => {
                  setOpen(false);
                  setSearch("");
                  onSelect(item);
                }}
              >
                <Text style={styles.itemTitle}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  triggerBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#2563EB",
  },
  triggerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  triggerLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  triggerValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  chevron: {
    color: "#94A3B8",
    fontSize: 22,
    marginLeft: 10,
    marginTop: -2,
  },
  modal: {
    flex: 1,
    backgroundColor: "#0B1220",
    paddingTop: 18,
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.25)",
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    color: "#93C5FD",
    fontSize: 14,
    fontWeight: "600",
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  list: {
    padding: 12,
    gap: 10,
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemPressed: {
    opacity: 0.85,
  },
  itemTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  itemDescription: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 24,
  },
});