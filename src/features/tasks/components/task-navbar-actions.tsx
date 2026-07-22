import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Menu } from "lucide-react-native";
import { ActionSheet, ActionSheetSection } from "../../../../components/ui/action-sheet";
import { IconButton } from "../../../../components/ui/icon-button";
import { Text } from "../../../../components/ui/text";
import { colors, minTapTarget, radius } from "../../../lib/theme";
import { type TaskMode, type TaskSortMode, type TaskViewMode } from "../task-ui";
import { TaskActionPanel } from "./task-panels/task-action-panel";
import { TaskLibraryPanel } from "./task-panels/task-library-panel";
import { TaskSortPanel } from "./task-panels/task-sort-panel";
import { TaskViewPanel } from "./task-panels/task-view-panel";

type TaskNavbarActionsProps = {
  orgId?: string;
  mode: TaskMode;
  viewMode: TaskViewMode;
  sortMode: TaskSortMode;
  onModeChange: (mode: TaskMode) => void;
  onViewModeChange: (viewMode: TaskViewMode) => void;
  onSortModeChange: (sortMode: TaskSortMode) => void;
  onResetPreferences: () => void;
  onAddTaskPress?: () => void;
};

export function TaskNavbarActions({
  orgId,
  mode,
  viewMode,
  sortMode,
  onModeChange,
  onViewModeChange,
  onSortModeChange,
  onResetPreferences,
  onAddTaskPress,
}: TaskNavbarActionsProps) {
  const [open, setOpen] = useState(false);
  const activePreferenceCount = (mode === "shared" ? 0 : 1) + (viewMode === "feed" ? 0 : 1) + (sortMode === "name-asc" ? 0 : 1);

  const handleAddTaskPress = () => {
    setOpen(false);

    if (onAddTaskPress) {
      onAddTaskPress();
      return;
    }

    Alert.alert(
      "Add task",
      orgId
        ? "Task creation is not wired up in the mobile app yet."
        : "Choose an organization before creating tasks.",
    );
  };

  const resetAndClose = () => {
    onResetPreferences();
    setOpen(false);
  };

  return (
    <>
      <View style={styles.shell}>
        <IconButton accessibilityLabel="Open task actions" onPress={() => setOpen(true)}>
          <Menu size={18} strokeWidth={2.4} color={colors.textPrimary} />
          {activePreferenceCount > 0 ? <View style={styles.badge} /> : null}
        </IconButton>
      </View>

      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Tasks"
      >
        <ActionSheetSection title="Create">
          <TaskActionPanel onAddTaskPress={handleAddTaskPress} />
          <TaskLibraryPanel mode={mode} onModeChange={onModeChange} />
        </ActionSheetSection>

        <ActionSheetSection title="View">
          <TaskViewPanel viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </ActionSheetSection>

        <ActionSheetSection title="Sort">
          <TaskSortPanel sortMode={sortMode} onSortModeChange={onSortModeChange} />
        </ActionSheetSection>

        <View style={styles.actionsRow}>
          <Pressable onPress={resetAndClose} hitSlop={12}>
            <Text variant="captionStrong" tone="accent">
              Reset preferences
            </Text>
          </Pressable>
        </View>
      </ActionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.accent,
  },
  actionsRow: {
    minHeight: minTapTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
