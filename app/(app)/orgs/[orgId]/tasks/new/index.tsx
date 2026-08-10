import { useLocalSearchParams, useRouter } from "expo-router";
import { TaskCreateScreen } from "../../../../../../src/features/tasks/task-create-screen";

export default function OrgTaskCreateScreen() {
  const router = useRouter();
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

        if (taskId) {
          router.replace({
            pathname: "/(app)/orgs/[orgId]/tasks/[taskId]",
            params: { orgId: resolvedOrgId, taskId },
          });
        } else {
          router.replace({
            pathname: "/(app)/orgs/[orgId]/tasks",
            params: { orgId: resolvedOrgId },
          });
        }
      }}
    />
  );
}
