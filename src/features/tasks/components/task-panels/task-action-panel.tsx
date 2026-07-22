import { Plus } from "lucide-react-native";
import { Button } from "../../../../../components/ui/button";
import { colors } from "../../../../lib/theme";

type TaskActionPanelProps = {
  onAddTaskPress: () => void;
};

export function TaskActionPanel({ onAddTaskPress }: TaskActionPanelProps) {
  return (
    <Button
      label="Add task"
      onPress={onAddTaskPress}
      leftIcon={<Plus size={16} strokeWidth={2.4} color={colors.textInverse} />}
      fullWidth
    />
  );
}
