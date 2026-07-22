import { DropdownSelect } from "../../../../../components/ui/dropdown-select";
import { TASK_SORT_OPTIONS, type TaskSortMode } from "../../task-ui";

type TaskSortPanelProps = {
  sortMode: TaskSortMode;
  onSortModeChange: (sortMode: TaskSortMode) => void;
};

export function TaskSortPanel({ sortMode, onSortModeChange }: TaskSortPanelProps) {
  return (
    <DropdownSelect
      label="Sort"
      selectedId={sortMode}
      placeholder="Name A–Z"
      items={TASK_SORT_OPTIONS.map((option) => ({
        id: option.value,
        name: option.label,
      }))}
      onSelect={(value) => onSortModeChange(value as TaskSortMode)}
    />
  );
}
