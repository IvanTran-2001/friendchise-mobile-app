import { apiFetch } from "../../../../lib/api/client";

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

export type OrgMemberRole = {
  role: {
    id: string;
    name: string;
    color: string | null;
  };
};

export type OrgRole = {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
};

export type OrgMember = {
  id: string;
  userId: string | null;
  botName: string | null;
  status: string;
  joinedAt: string;
  workingDays: string[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  memberRoles: OrgMemberRole[];
  name: string;
  description?: string;
};

export type OrgMembersPage = {
  memberships: OrgMember[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type InviteMemberInput = {
  email: string;
  roleIds?: string[];
  workingDays?: string[];
};

export type CreateBotMembershipInput = {
  botName: string;
  workingDays?: string[];
};

export type MobileInviteSubtype = "MEMBER" | "BOT_SLOT" | "FRANCHISE";

export type MobileInviteItem = {
  id: string;
  type: string;
  subtype: MobileInviteSubtype;
  status: string;
  orgId: string;
  orgName: string;
  inviterName: string | null;
  seenAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  metadata: unknown;
};

export type MobileInvitesPage = {
  invites: MobileInviteItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PendingMobileInviteCountResponse = {
  count: number;
};

export type OrgRolesResponse = {
  roles: OrgRole[];
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

export async function leaveOrganization(orgId: string) {
  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${orgId}/leave`, {
    method: "DELETE",
  });
}

export async function deleteOrganization(orgId: string, confirmName: string) {
  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${orgId}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmName }),
  });
}

export async function fetchOrgMembersPage(orgId: string, page = 1, pageSize = 20, search?: string) {
  const encodedOrgId = encodeURIComponent(orgId);
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (search?.trim()) {
    params.set("search", search.trim());
  }

  return apiFetch<OrgMembersPage>(
    `/api/orgs/${encodedOrgId}/memberships?${params.toString()}`,
  );
}

export async function inviteOrgMember(orgId: string, input: InviteMemberInput) {
  const encodedOrgId = encodeURIComponent(orgId);

  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${encodedOrgId}/memberships`, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      roleIds: input.roleIds ?? [],
      workingDays: input.workingDays ?? [],
    }),
  });
}

export async function createOrgBot(orgId: string, input: CreateBotMembershipInput) {
  const encodedOrgId = encodeURIComponent(orgId);

  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${encodedOrgId}/memberships/bots`, {
    method: "POST",
    body: JSON.stringify({
      botName: input.botName,
      workingDays: input.workingDays ?? [],
    }),
  });
}

export async function fetchOrgRoles(orgId: string) {
  const encodedOrgId = encodeURIComponent(orgId);
  return apiFetch<OrgRolesResponse>(`/api/mobile/me/organizations/${encodedOrgId}/roles`);
}

export async function updateOrgMember(orgId: string, membershipId: string, roleIds: string[]) {
  const encodedOrgId = encodeURIComponent(orgId);
  const encodedMembershipId = encodeURIComponent(membershipId);

  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${encodedOrgId}/memberships/${encodedMembershipId}`, {
    method: "PATCH",
    body: JSON.stringify({ roleIds }),
  });
}

export async function deleteOrgMember(orgId: string, membershipId: string) {
  const encodedOrgId = encodeURIComponent(orgId);
  const encodedMembershipId = encodeURIComponent(membershipId);

  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${encodedOrgId}/memberships/${encodedMembershipId}`, {
    method: "DELETE",
  });
}

export async function convertOrgMemberToBot(orgId: string, membershipId: string, overrideName: string) {
  const encodedOrgId = encodeURIComponent(orgId);
  const encodedMembershipId = encodeURIComponent(membershipId);

  return apiFetch<{ ok: true }>(`/api/mobile/me/organizations/${encodedOrgId}/memberships/${encodedMembershipId}/convert`, {
    method: "POST",
    body: JSON.stringify({ kind: "bot", overrideName }),
  });
}

export async function fetchMobileInvites(page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return apiFetch<MobileInvitesPage>(`/api/mobile/me/invites?${params.toString()}`);
}

export async function acceptMobileInvite(inviteId: string) {
  const encodedInviteId = encodeURIComponent(inviteId);
  return apiFetch<{ ok: true }>(`/api/mobile/me/invites/${encodedInviteId}/accept`, {
    method: "POST",
  });
}

export async function declineMobileInvite(inviteId: string) {
  const encodedInviteId = encodeURIComponent(inviteId);
  return apiFetch<{ ok: true }>(`/api/mobile/me/invites/${encodedInviteId}/decline`, {
    method: "POST",
  });
}

export async function fetchPendingMobileInviteCount() {
  return apiFetch<PendingMobileInviteCountResponse>("/api/mobile/me/invites/pending-count");
}
