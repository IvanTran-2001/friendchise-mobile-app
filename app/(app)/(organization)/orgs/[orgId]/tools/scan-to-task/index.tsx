import { useOrgIdParam } from "../../../../../../../hooks/use-org-id-param";
import { ScanToTaskScreen } from "../../../../../../../src/features/tools/scan-to-task/scan-to-task-screen";

export default function ScanToTaskRoute() {
  const orgId = useOrgIdParam();

  return <ScanToTaskScreen orgId={orgId} />;
}
