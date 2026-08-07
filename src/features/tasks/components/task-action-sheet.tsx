import { useRef } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { ActionSheet, ActionSheetSection } from "../../../../components/ui/action-sheet";
import { Text } from "../../../../components/ui/text";
import { colors, minTapTarget, radius } from "../../../lib/theme";
import { type TaskMode, type TaskSortMode, type TaskViewMode } from "../task-ui";
import { TaskActionPanel } from "./task-panels/task-action-panel";
import { TaskLibraryPanel } from "./task-panels/task-library-panel";
import { TaskSortPanel } from "./task-panels/task-sort-panel";
import { TaskViewPanel } from "./task-panels/task-view-panel";

type TaskActionSheetProps = {
  visible: boolean;
  onClose: () => void;
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

export function TaskActionSheet({
  visible,
  onClose,
  orgId,
  mode,
  viewMode,
  sortMode,
  onModeChange,
  onViewModeChange,
  onSortModeChange,
  onResetPreferences,
  onAddTaskPress,
}: TaskActionSheetProps) {
  const pendingAddTaskAlertRef = useRef<{ title: string; message: string } | null>(null);

  const handleAddTaskPress = () => {
    if (onAddTaskPress) {
      onClose();
      onAddTaskPress();
      return;
    }

    pendingAddTaskAlertRef.current = {
      title: "Add task",
      message: orgId
        ? "Task creation is not wired up in the mobile app yet."
        : "Choose an organization before creating tasks.",
    };

    onClose();
  };

  const resetAndClose = () => {
    onResetPreferences();
    onClose();
  };

  const handleDismiss = () => {
    const pendingAlert = pendingAddTaskAlertRef.current;

    if (!pendingAlert) {
      return;
    }

    pendingAddTaskAlertRef.current = null;
    Alert.alert(pendingAlert.title, pendingAlert.message);
  };

  return (
    <ActionSheet visible={visible} onClose={onClose} onDismiss={handleDismiss} title="Tasks">
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
        <Pressable onPress={resetAndClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Reset preferences">
          <Text variant="captionStrong" tone="accent">
            Reset preferences
          </Text>
        </Pressable>
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
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