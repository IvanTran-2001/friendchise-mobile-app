import { useLocalSearchParams } from "expo-router";
import { OrgHomeScreen } from "../../../../src/features/orgs/org-home-screen";

export default function OrgHomeRoute() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;

  return <OrgHomeScreen orgId={orgId} />;
}