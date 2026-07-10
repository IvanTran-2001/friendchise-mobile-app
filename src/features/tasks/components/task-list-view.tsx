import { FlatList, StyleSheet, Text, View } from "react-native";
import type { TaskItem } from "../task-api";

type TaskListViewProps = {
  tasks: TaskItem[];
  isLoading: boolean;
  error: unknown;
  search: string;
  header?: React.ReactElement | null;
  onScroll?: (event: any) => void;
};

export function TaskListView({ tasks, isLoading, error, search, header, onScroll }: TaskListViewProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      onScroll={onScroll}
      ListHeaderComponent={header ?? null}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.status}</Text>
        </View>
      )}
      ListEmptyComponent={
        !isLoading && !error ? (
          <Text style={styles.stateText}>{search.trim() ? "No matching tasks." : "No tasks yet."}</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardMeta: {
    color: "#64748B",
    fontSize: 13,
  },
  stateText: {
    color: "#64748B",
    marginBottom: 12,
  },
});