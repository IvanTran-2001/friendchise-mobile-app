import { useSegments } from "expo-router";

export function useCurrentOrgId() {
  const segments = useSegments();
  const routeSegments = segments as unknown as string[];
  const orgIndex = routeSegments.indexOf("orgs");

  if (orgIndex < 0) {
    return null;
  }

  const orgId = routeSegments[orgIndex + 1];
  return orgId || null;
}