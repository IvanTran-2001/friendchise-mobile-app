import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../src/features/tasks/task-api";
import { clearAuthToken } from "../../src/features/auth/token-store";
import { useAuthStore } from "../../src/features/auth/auth-store";

export default function TasksScreen() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  async function handleLogout() {
    await clearAuthToken();
    setAuthenticated(false);
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Your current work queue.</Text>

      <View style={styles.actionsRow}>
        <Pressable style={styles.refreshButton} onPress={() => refetch()}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
        <Pressable
          style={[styles.refreshButton, styles.logoutButton]}
          onPress={() => {
            Alert.alert("Log out", "Remove the current session?", [
              { text: "Cancel", style: "cancel" },
              { text: "Log out", style: "destructive", onPress: handleLogout },
            ]);
          }}
        >
          <Text style={styles.refreshText}>Log out</Text>
        </Pressable>
      </View>

      {isLoading ? <Text style={styles.stateText}>Loading tasks...</Text> : null}
      {error ? <Text style={styles.stateText}>Failed to load tasks.</Text> : null}

      <FlatList
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
  refreshButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1F2937",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: "#3F1D1D",
    marginLeft: 12,
  },
  actionsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  refreshText: {
    color: "#E2E8F0",
    fontWeight: "600",
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