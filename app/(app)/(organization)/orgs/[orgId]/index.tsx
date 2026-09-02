import { OrgHomeScreen } from "../../../../../src/features/orgs/org-mode/home/org-home-screen";
import { useOrgIdParam } from "../../../../../hooks/use-org-id-param";

export default function OrgHomeRoute() {
  const orgId = useOrgIdParam();

  return <OrgHomeScreen orgId={orgId} />;
}