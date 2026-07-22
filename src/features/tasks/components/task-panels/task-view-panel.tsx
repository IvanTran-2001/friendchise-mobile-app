import { DropdownSelect } from "../../../../../components/ui/dropdown-select";
import type { TaskViewMode } from "../../task-ui";

type TaskViewPanelProps = {
  viewMode: TaskViewMode;
  onViewModeChange: (viewMode: TaskViewMode) => void;
};

export function TaskViewPanel({ viewMode, onViewModeChange }: TaskViewPanelProps) {
  return (
    <DropdownSelect
      label="View"
      selectedId={viewMode}
      placeholder="Feed"
      items={[
        { id: "list", name: "List" },
        { id: "feed", name: "Feed" },
        { id: "card", name: "Card" },
      ]}
      onSelect={(value) => onViewModeChange(value as TaskViewMode)}
    />
  );
}
