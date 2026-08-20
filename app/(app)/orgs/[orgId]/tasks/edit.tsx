import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LoadingState, ErrorState } from "../../../../../components/ui/state-views";
import { useOrgIdParam } from "../../../../../hooks/use-org-id-param";
import { getTaskById } from "../../../../../src/features/tasks/task-api";
import { TaskCreateScreen } from "../../../../../src/features/tasks/task-create-screen";

export default function OrgTaskEditScreen() {
  const router = useRouter();
  const resolvedOrgId = useOrgIdParam();
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;

  const taskQuery = useQuery({
    queryKey: ["task", resolvedOrgId, taskId],
    queryFn: () => getTaskById(resolvedOrgId ?? "", taskId ?? ""),
    enabled: !!resolvedOrgId && !!taskId,
  });

  if (taskQuery.isLoading) {
    return <LoadingState message="Loading task…" />;
  }

  if (taskQuery.error || !taskQuery.data) {
    return <ErrorState title="Failed to load task" />;
  }

  return (
    <TaskCreateScreen
      orgId={resolvedOrgId}
      task={taskQuery.data}
      onCancel={() => router.back()}
      onSubmitted={() => {
        if (!resolvedOrgId || !taskId) {
          return;
        }

        router.replace({
          pathname: "/(app)/orgs/[orgId]/tasks/[taskId]",
          params: { orgId: resolvedOrgId, taskId },
        });
      }}
    />
  );
}