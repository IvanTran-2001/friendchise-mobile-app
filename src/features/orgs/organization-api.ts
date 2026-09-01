import { apiFetch } from "../../lib/api/client";

export type Org = {
  id: string;
  name: string;
  image?: string | null;
};

export type OrgResponse = {
  organizations: Org[];
};

export type CreateOrganizationInput = {
  title: string;
  timezone?: string;
  address?: string;
  operatingDays?: string[];
  openTimeMin?: number;
  closeTimeMin?: number;
};

export type CreateOrganizationResponse = {
  organization: Org;
};

export type JoinOrganizationInput = {
  token: string;
  timezone?: string;
  address?: string;
  operatingDays?: string[];
  openTimeMin?: number;
  closeTimeMin?: number;
};

export type JoinOrganizationResponse = {
  organization: Org;
};

export async function fetchOrganizations() {
  return apiFetch<OrgResponse>("/api/mobile/me/organizations");
}

export async function createOrganization(input: CreateOrganizationInput) {
  return apiFetch<CreateOrganizationResponse>("/api/mobile/me/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function joinOrganization(input: JoinOrganizationInput) {
  return apiFetch<JoinOrganizationResponse>("/api/mobile/me/organizations/join", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
