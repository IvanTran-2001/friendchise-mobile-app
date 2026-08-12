import { useLocalSearchParams } from "expo-router";

/**
 * Resolves the `orgId` route param, unwrapping array values and rejecting
 * unresolved "[orgId]" static-render placeholders.
 */
export function useOrgIdParam() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const raw = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  return raw && !raw.startsWith("[") ? raw : undefined;
}
