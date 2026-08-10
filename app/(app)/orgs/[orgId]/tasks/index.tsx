import { useLocalSearchParams } from "expo-router";
import { TaskListScreen } from "../../../../../src/features/tasks/task-list-screen";

export default function OrgTasksScreen() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;
  return <TaskListScreen orgId={resolvedOrgId} />;
}