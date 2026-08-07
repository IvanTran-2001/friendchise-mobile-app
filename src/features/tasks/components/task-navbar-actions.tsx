import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Menu } from "lucide-react-native";
import { IconButton } from "../../../../components/ui/icon-button";
import { colors } from "../../../lib/theme";
import { DEFAULT_TASK_UI_PREFERENCES } from "../task-persistence-store";
import { type TaskMode, type TaskSortMode, type TaskViewMode } from "../task-ui";
import { TaskActionSheet } from "./task-action-sheet";

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
  const activePreferenceCount =
    (mode === DEFAULT_TASK_UI_PREFERENCES.mode ? 0 : 1) +
    (viewMode === DEFAULT_TASK_UI_PREFERENCES.viewMode ? 0 : 1) +
    (sortMode === DEFAULT_TASK_UI_PREFERENCES.sortMode ? 0 : 1);

  return (
    <>
      <View style={styles.shell}>
        <IconButton accessibilityLabel="Open task actions" badge={activePreferenceCount > 0} onPress={() => setOpen(true)}>
          <Menu size={18} strokeWidth={2.4} color={colors.textPrimary} />
        </IconButton>
      </View>

      <TaskActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        orgId={orgId}
        mode={mode}
        viewMode={viewMode}
        sortMode={sortMode}
        onModeChange={onModeChange}
        onViewModeChange={onViewModeChange}
        onSortModeChange={onSortModeChange}
        onResetPreferences={onResetPreferences}
        onAddTaskPress={onAddTaskPress}
      />
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
});
