import { ScanToTaskScreen } from "../../../../../../src/features/scan-to-task/scan-to-task-screen";
import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";

export default function ScanToTaskRoute() {
  const orgId = useOrgIdParam();
  return <ScanToTaskScreen orgId={orgId} />;
}