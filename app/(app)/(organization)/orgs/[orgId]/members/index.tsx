import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";
import { OrgMembersScreen } from "../../../../../../src/features/orgs/org-mode/members/org-members-screen";

export default function OrgMembersRoute() {
  const orgId = useOrgIdParam();

  if (!orgId) {
    return null;
  }

  return <OrgMembersScreen orgId={orgId} />;
}