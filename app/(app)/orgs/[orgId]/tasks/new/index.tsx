import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { TaskCreateScreen } from "../../../../../../src/features/tasks/task-create-screen";

export default function OrgTaskCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;

  return (
    <TaskCreateScreen
      orgId={resolvedOrgId}
      onCancel={() => router.back()}
      onCreated={(taskId) => {
        if (!resolvedOrgId) {
          return;
        }

        const destination = taskId
          ? `/(app)/orgs/${resolvedOrgId}/tasks/${taskId}`
          : `/(app)/orgs/${resolvedOrgId}/tasks`;

        router.replace(destination);
        void queryClient.invalidateQueries({ queryKey: ["tasks", resolvedOrgId] });
      }}
    />
  );
}
