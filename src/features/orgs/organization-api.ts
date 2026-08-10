import { apiFetch } from "../../lib/api/client";

export type Org = {
  id: string;
  name: string;
  image?: string | null;
};

export type OrgResponse = {
  organizations: Org[];
};

export async function fetchOrganizations() {
  return apiFetch<OrgResponse>("/api/mobile/me/organizations");
}
