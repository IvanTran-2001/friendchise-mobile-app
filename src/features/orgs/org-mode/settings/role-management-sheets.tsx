import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Check, Pencil, Trash2 } from "lucide-react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListRow } from "../../../../../components/ui/list-row";
import { SearchField } from "../../../../../components/ui/search-field";
import { SheetModal } from "../../../../../components/ui/sheet-modal";
import { TextField } from "../../../../../components/ui/text-field";
import { Text } from "../../../../../components/ui/text";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { ListSkeleton } from "../../../../../components/ui/list-skeleton";
import { colors, spacing } from "../../../../lib/theme";
import { useDebouncedValue } from "../../../../../hooks/use-debounced-value";
import { useDismissKeyboardOnIdle } from "../../../../../hooks/use-dismiss-keyboard-on-idle";
import { getTasks } from "../../../tasks/task-api";
import { updateOrgRole, type OrgRole } from "../shared/organization-api";
import { ROLE_PERMISSION_ACTIONS, formatPermissionLabel, type RolePermissionAction } from "./role-permissions";

type RoleActionsSheetProps = {
  visible: boolean;
  role: OrgRole | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function RoleActionsSheet({ visible, role, onClose, onEdit, onDelete }: RoleActionsSheetProps) {
  return (
    <SheetModal visible={visible} onClose={onClose} title={role?.name ?? "Role"} subtitle="Choose an action">
      <View style={styles.menuList}>
        <ListRow
          title="Edit role"
          subtitle="Update name, color, permissions, and tasks."
          leading={<Pencil size={18} strokeWidth={2.2} color={colors.textPrimary} />}
          trailing="chevron"
          onPress={onEdit}
        />

        {role?.isDeletable ? (
          <ListRow
            title="Delete role"
            subtitle="Remove the role from the organization."
            leading={<Trash2 size={18} strokeWidth={2.2} color={colors.danger} />}
            trailing="chevron"
            onPress={onDelete}
          />
        ) : null}
      </View>
    </SheetModal>
  );
}

type RoleEditorSheetProps = {
  orgId: string;
  visible: boolean;
  role: OrgRole | null;
  onClose: () => void;
  onSaved: () => void;
};

const TASK_PAGE_SIZE = 25;

const ROLE_COLOR_OPTIONS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function RoleEditorSheet({ orgId, visible, role, onClose, onSaved }: RoleEditorSheetProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#808080");
  const [permissions, setPermissions] = useState<RolePermissionAction[]>([]);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const debouncedTaskSearch = useDebouncedValue(taskSearch, 150);
  const isTaskSearchSettled = debouncedTaskSearch === taskSearch;

  const tasksQuery = useInfiniteQuery({
    queryKey: ["mobile-org-role-tasks", orgId, debouncedTaskSearch],
    queryFn: ({ pageParam = null }) =>
      getTasks(orgId, {
        limit: TASK_PAGE_SIZE,
        cursor: pageParam,
        search: debouncedTaskSearch,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: visible && taskPickerOpen && isTaskSearchSettled,
  });

  const roleTasks = useMemo(() => role?.eligibleFor.map(({ task }) => task) ?? [], [role?.eligibleFor]);
  const taskLookup = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();

    for (const task of roleTasks) {
      map.set(task.id, task);
    }

    for (const task of tasksQuery.data?.pages.flatMap((page) => page.tasks) ?? []) {
      map.set(task.id, { id: task.id, name: task.name, color: task.color });
    }

    return map;
  }, [roleTasks, tasksQuery.data?.pages]);

  const selectedTasks = useMemo(
    () =>
      taskIds
        .map((taskId) => taskLookup.get(taskId))
        .filter((task): task is { id: string; name: string; color: string } => Boolean(task)),
    [taskIds, taskLookup],
  );

  const tasks = useMemo(() => tasksQuery.data?.pages.flatMap((page) => page.tasks) ?? [], [tasksQuery.data?.pages]);
  const availableTasks = useMemo(() => tasks, [tasks]);

  useEffect(() => {
    if (!visible || !role) {
      return;
    }

    setName(role.name);
    setColor(role.color ?? "#808080");
    setPermissions(role.permissions.map((permission) => permission.action as RolePermissionAction));
    setTaskIds(role.eligibleFor.map(({ task }) => task.id));
    setTaskSearch("");
    setTaskPickerOpen(false);
  }, [role, visible]);

  useDismissKeyboardOnIdle(taskSearch, 1000, { enabled: taskPickerOpen });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateOrgRole(orgId, role?.id ?? "", {
        name: name.trim(),
        color: color.trim() || undefined,
        permissions,
        taskIds,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mobile-org-roles", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["mobile-org-members", orgId] }),
      ]);
      onSaved();
    },
    onError: (error) => {
      Alert.alert("Could not update role", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const canSave = Boolean(role) && name.trim().length > 0 && !updateMutation.isPending;

  const togglePermission = (action: RolePermissionAction) => {
    setPermissions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action],
    );
  };

  const toggleTask = (taskId: string) => {
    setTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  };

  if (!role) {
    return null;
  }

  return (
    <>
      <SheetModal visible={visible} onClose={onClose} title="Edit role" subtitle="Update role details.">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editorContent}>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Kitchen Staff" autoCorrect={false} />

          <View style={styles.section}>
            <Text variant="label" tone="secondary" style={styles.sectionLabel}>
              Color
            </Text>
            <TextField value={color} onChangeText={setColor} placeholder="#808080" autoCapitalize="none" autoCorrect={false} />
            <View style={styles.colorRow}>
              {ROLE_COLOR_OPTIONS.map((option) => {
                const selected = option.toLowerCase() === color.trim().toLowerCase();

                return (
                  <Pressable
                    key={option}
                    onPress={() => setColor(option)}
                    style={({ pressed }) => [
                      styles.colorSwatch,
                      { backgroundColor: option, borderColor: selected ? colors.textPrimary : option },
                      pressed && styles.colorSwatchPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose color ${option}`}
                  >
                    {selected ? <Check size={14} strokeWidth={2.5} color={colors.background} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="label" tone="secondary" style={styles.sectionLabel}>
              Permissions
            </Text>
            <View style={styles.pickerList}>
              {ROLE_PERMISSION_ACTIONS.map((action) => {
                const selected = permissions.includes(action);

                return (
                  <ListRow
                    key={action}
                    title={formatPermissionLabel(action)}
                    trailing={selected ? "check" : null}
                    onPress={() => togglePermission(action)}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="label" tone="secondary" style={styles.sectionLabel}>
              Tasks
            </Text>
            {selectedTasks.length > 0 ? (
              <View style={styles.badgeList}>
                {selectedTasks.map((task) => (
                  <Pressable
                    key={task.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${task.name}`}
                    onPress={() => toggleTask(task.id)}
                    style={({ pressed }) => [styles.taskBadgeButton, pressed && styles.taskBadgeButtonPressed]}
                  >
                    <Badge label={task.name} dotted dotColor={task.color} tone="neutral" />
                    <Text variant="caption" tone="secondary" style={styles.taskBadgeHint}>
                      Remove
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text variant="caption" tone="secondary">
                No tasks assigned.
              </Text>
            )}

            <Button label="Choose tasks" onPress={() => setTaskPickerOpen(true)} variant="outline" fullWidth />
          </View>

          <Button
            label={updateMutation.isPending ? "Saving..." : "Save role"}
            onPress={() => updateMutation.mutate()}
            disabled={!canSave}
            fullWidth
          />
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={taskPickerOpen}
        onClose={() => setTaskPickerOpen(false)}
        title="Choose tasks"
        subtitle="Select tasks this role can perform."
      >
        <SearchField autoFocusOnMount value={taskSearch} onChangeText={setTaskSearch} placeholder="Search tasks" />

        <FlatList
          data={availableTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.taskPickerList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={() => {
            if (tasksQuery.hasNextPage && !tasksQuery.isFetchingNextPage) {
              void tasksQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshing={tasksQuery.isRefetching && !tasksQuery.isFetchingNextPage}
          onRefresh={() => void tasksQuery.refetch()}
          ListEmptyComponent={
            tasksQuery.isLoading && tasks.length === 0 ? (
              <ListSkeleton variant="role" count={3} />
            ) : (
              <Text variant="body" tone="secondary" align="center" style={styles.emptyText}>
                {taskSearch.trim() ? "No matching tasks" : "No tasks available"}
              </Text>
            )
          }
          ListFooterComponent={
            tasksQuery.isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const selected = taskIds.includes(item.id);

            return (
              <ListRow
                title={item.name}
                subtitle={selected ? "Tap to remove" : undefined}
                leading={<View style={[styles.taskDot, { backgroundColor: item.color }]} />}
                trailing={selected ? "check" : null}
                onPress={() => toggleTask(item.id)}
              />
            );
          }}
        />
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  menuList: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  editorContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchPressed: {
    opacity: 0.8,
  },
  pickerList: {
    gap: spacing.xs,
  },
  badgeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  taskBadgeButton: {
    alignItems: "flex-start",
    gap: 4,
  },
  taskBadgeButtonPressed: {
    opacity: 0.8,
  },
  taskBadgeHint: {
    alignSelf: "center",
  },
  taskPickerList: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyText: {
    paddingVertical: spacing.xxl,
  },
  footerLoading: {
    paddingTop: spacing.md,
    alignItems: "center",
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});