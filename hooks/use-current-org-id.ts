import { usePathname } from "expo-router";

export function useCurrentOrgId() {
  const pathname = usePathname();
  const match = pathname.match(/\/orgs\/([^/]+)/);
  return match?.[1] ?? null;
}