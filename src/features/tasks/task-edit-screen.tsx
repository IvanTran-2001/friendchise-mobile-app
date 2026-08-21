import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "../../../components/ui/state-views";
import { useOrgIdParam } from "../../../hooks/use-org-id-param";
import { getTaskById } from "./task-api";
import { TaskCreateScreen } from "./task-create-screen";

export function TaskEditScreen() {
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

  if (!resolvedOrgId || !taskId || taskQuery.error || !taskQuery.data) {
    return <ErrorState title="Failed to load task" />;
  }

  return (
    <TaskCreateScreen
      orgId={resolvedOrgId}
      task={taskQuery.data}
      onCancel={() => router.back()}
      onSubmitted={() => {
        router.replace({
          pathname: "/(app)/orgs/[orgId]/tasks/[taskId]",
          params: { orgId: resolvedOrgId, taskId },
        });
      }}
    />
  );
}