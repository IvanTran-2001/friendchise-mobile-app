import { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../../src/features/tasks/task-api";
import { APP_SHELL_BG } from "../../../../../src/lib/theme";
import { useRegisterNavbarActions } from "../../../../../components/layout/navbar-context";
import { TaskNavbarActions } from "../../../../../src/features/tasks/components/task-navbar-actions";
import { TaskListView } from "../../../../../src/features/tasks/components/task-list-view";

function TaskNavContent() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;
  const [search, setSearch] = useState("");
  const navbarActions = useMemo(() => {
    return <TaskNavbarActions search={search} onSearchChange={setSearch} />;
  }, [search]);

  useRegisterNavbarActions(navbarActions);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", resolvedOrgId ?? "current"],
    queryFn: () => getTasks(resolvedOrgId),
  });

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return data ?? [];
    }

    return (data ?? []).filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query)
      );
    });
  }, [data, search]);

  return (
    <View style={styles.container}>
      {isLoading ? <Text style={styles.stateText}>Loading tasks...</Text> : null}
      {error ? <Text style={styles.stateText}>Failed to load tasks.</Text> : null}

      <TaskListView
        tasks={filteredTasks}
        isLoading={isLoading}
        error={error}
        search={search}
        header={
          <View style={styles.header}>
            <Text style={styles.title}>Tasks</Text>
          </View>
        }
      />
    </View>
  );
}

export default function OrgTasksScreen() {
  return <TaskNavContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: APP_SHELL_BG,
  },
  header: {
    paddingBottom: 8,
  },
  title: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "700",
  },
  stateText: {
    color: "#64748B",
    marginBottom: 12,
  },
});