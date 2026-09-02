import { usePathname } from "expo-router";

export function useCurrentOrgId() {
  const pathname = usePathname();
  const match = pathname.match(/\/orgs\/([^/]+)/);
  const orgId = match?.[1] ?? null;

  if (!orgId || ["new", "join", "invite", "invites"].includes(orgId)) {
    return null;
  }

  return orgId;
}