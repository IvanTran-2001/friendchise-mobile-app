import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";
import { OrgToolsScreen } from "../../../../../../src/features/tools/org-tools-screen";

export default function OrgToolsRoute() {
  const orgId = useOrgIdParam();

  if (!orgId) {
    return null;
  }

  return <OrgToolsScreen orgId={orgId} />;
}