import { useRouter } from "expo-router";
import { useOrgIdParam } from "../../../../../../../hooks/use-org-id-param";
import { TaskCreateScreen } from "../../../../../../../src/features/tasks/task-create-screen";

export default function TaskCreateRoute() {
  const router = useRouter();
  const orgId = useOrgIdParam();

  return (
    <TaskCreateScreen
      orgId={orgId}
      onCancel={() => router.back()}
      onSubmitted={(taskId) => {
        if (taskId) {
          router.replace({
            pathname: "/(app)/orgs/[orgId]/tasks/[taskId]",
            params: { orgId: orgId ?? "", taskId },
          });
          return;
        }

        router.replace(orgId ? `/(app)/orgs/${orgId}/tasks` : "/(app)");
      }}
    />
  );
}
