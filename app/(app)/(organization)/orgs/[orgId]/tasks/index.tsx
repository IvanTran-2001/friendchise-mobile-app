import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";
import { TaskListScreen } from "../../../../../../src/features/tasks/task-list-screen";

export default function OrgTasksRoute() {
  const orgId = useOrgIdParam();

  if (!orgId) {
    return null;
  }

  return <TaskListScreen orgId={orgId} />;
}