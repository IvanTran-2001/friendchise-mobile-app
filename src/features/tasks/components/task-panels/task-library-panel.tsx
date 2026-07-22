import { DropdownSelect } from "../../../../../components/ui/dropdown-select";
import type { TaskMode } from "../../task-ui";

type TaskLibraryPanelProps = {
  mode: TaskMode;
  onModeChange: (mode: TaskMode) => void;
};

export function TaskLibraryPanel({ mode, onModeChange }: TaskLibraryPanelProps) {
  return (
    <DropdownSelect
      label="Library"
      selectedId={mode}
      placeholder="All"
      items={[
        { id: "shared", name: "All" },
        { id: "list", name: "Mine" },
        { id: "available", name: "Shared" },
      ]}
      onSelect={(value) => onModeChange(value as TaskMode)}
    />
  );
}
