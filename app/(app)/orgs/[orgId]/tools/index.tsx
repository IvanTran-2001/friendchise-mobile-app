import { OrgToolsScreen } from "../../../../../src/features/tools/org-tools-screen";
import { useOrgIdParam } from "../../../../../hooks/use-org-id-param";

export default function OrgToolsRoute() {
  const orgId = useOrgIdParam();
  return <OrgToolsScreen orgId={orgId} />;
}