import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../../lib/api/client";

export type OrgSettingsPermissions = {
  canManageOrgSettings: boolean;
  canManageRoles: boolean;
  canManageSettings: boolean;
};

export async function fetchOrgSettingsPermissions(orgId: string) {
  return apiFetch<OrgSettingsPermissions>(`/api/mobile/me/organizations/${orgId}/settings/permissions`);
}

export function useOrgSettingsPermissions(orgId?: string | null) {
  return useQuery({
    queryKey: ["mobile-org-settings-permissions", orgId],
    queryFn: () => fetchOrgSettingsPermissions(orgId ?? ""),
    enabled: Boolean(orgId),
  });
}