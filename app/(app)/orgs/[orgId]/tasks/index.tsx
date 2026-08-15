import { TaskListScreen } from "../../../../../src/features/tasks/task-list-screen";
import { useOrgIdParam } from "../../../../../hooks/use-org-id-param";

export default function OrgTasksScreen() {
  const orgId = useOrgIdParam();
  return <TaskListScreen orgId={orgId} />;
}