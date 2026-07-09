import { apiFetch } from "../../lib/api/client";

export type TaskItem = {
  id: string;
  title: string;
  status: string;
};

type WebTask = {
  id: string;
  name: string;
  color: string;
};

type MobileOrganizationResponse = {
  orgId: string;
  organization: {
    id: string;
    name: string;
  };
};

export async function getTasks(orgId?: string) {
  const activeOrg = orgId
    ? { orgId }
    : await apiFetch<MobileOrganizationResponse>("/api/mobile/me/organization");

  const response = await apiFetch<{ tasks: WebTask[] }>(
    `/api/orgs/${activeOrg.orgId}/tasks/simple`,
  );

  return response.tasks.map((task) => ({
    id: task.id,
    title: task.name,
    status: task.color,
  })) satisfies TaskItem[];
}