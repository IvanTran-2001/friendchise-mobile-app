import { useRouter } from "expo-router";
import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";
import { TaskCreateScreen } from "../../../../../../src/features/tasks/task-create-screen";

export default function OrgTaskCreateScreen() {
  const router = useRouter();
  const resolvedOrgId = useOrgIdParam();

  return (
    <TaskCreateScreen
      orgId={resolvedOrgId}
      onCancel={() => router.back()}
      onSubmitted={(taskId) => {
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
