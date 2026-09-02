import { useOrgIdParam } from "../../../../../../hooks/use-org-id-param";
import { OrgSettingsScreen } from "../../../../../../src/features/orgs/org-mode/settings/org-settings-screen";

export default function OrgSettingsUserRoute() {
  const orgId = useOrgIdParam();

  if (!orgId) {
    return null;
  }

  return <OrgSettingsScreen orgId={orgId} section="user" />;
}