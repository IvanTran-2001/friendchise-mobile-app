import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../src/features/tasks/task-api";
import { useRegisterTabScrollToTop } from "../../../../components/layout/tab-scroll-to-top-context";

export default function OrgTasksScreen() {
  const listRef = useRef<FlatList<any> | null>(null);
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;

  useRegisterTabScrollToTop(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", resolvedOrgId ?? "current"],
    queryFn: () => getTasks(resolvedOrgId),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Your current work queue.</Text>

      {isLoading ? <Text style={styles.stateText}>Loading tasks...</Text> : null}
      {error ? <Text style={styles.stateText}>Failed to load tasks.</Text> : null}

      <FlatList
        ref={listRef}
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text style={styles.stateText}>No tasks yet.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#0B1220",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#111827",
    borderColor: "#243041",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardMeta: {
    color: "#94A3B8",
    fontSize: 13,
  },
  stateText: {
    color: "#94A3B8",
    marginBottom: 12,
  },
});