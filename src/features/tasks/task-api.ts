import { apiFetch } from "../../lib/api/client";
import type { TaskMode, TaskSortMode } from "./task-ui";

export type TaskItem = {
  id: string;
  orgId: string;
  name: string;
  color: string;
  description: string | null;
  durationMin: number;
  minPeople: number;
  createdAt: string;
  imageSignedUrl?: string | null;
  _available: boolean;
};

type MobileTaskResponse = {
  id: string;
  orgId: string;
  name: string;
  color: string;
  description: string | null;
  durationMin: number;
  minPeople: number;
  createdAt: string;
  imageSignedUrl?: string | null;
  _available: boolean;
};

type MobileOrganizationResponse = {
  orgId: string;
  organization: {
    id: string;
    name: string;
  };
};

export async function getTasks(
  orgId?: string,
  options: { mode?: TaskMode; sort?: TaskSortMode } = {},
) {
  const activeOrg = orgId
    ? { orgId }
    : await apiFetch<MobileOrganizationResponse>("/api/mobile/me/organization");

  const params = new URLSearchParams();
  if (options.mode && options.mode !== "shared") {
    params.set("mode", options.mode);
  }
  if (options.sort && options.sort !== "name-asc") {
    params.set("sort", options.sort);
  }
  params.set("limit", "100");

  const response = await apiFetch<{ tasks: MobileTaskResponse[] }>(
    `/api/orgs/${activeOrg.orgId}/tasks/paginated?${params.toString()}`,
  );

  return response.tasks.map((task) => ({
    id: task.id,
    orgId: task.orgId,
    name: task.name,
    color: task.color,
    description: task.description,
    durationMin: task.durationMin,
    minPeople: task.minPeople,
    createdAt: task.createdAt,
    imageSignedUrl: task.imageSignedUrl ?? null,
    _available: task._available,
  })) satisfies TaskItem[];
}

export type TaskDetailItem = TaskItem & {
  preferredStartTimeMin: number | null;
  scope: "ORG" | "GLOBAL";
  organization?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string | null; image: string | null } | null;
  eligibility: { role: { id: string; name: string; color: string | null } }[];
  tags: { tag: { id: string; name: string; color: string } }[];
  taskToolLinks: { toolPath: string; toolLabel: string | null }[];
  comments: {
    id: string;
    content: string;
    authorName: string;
    authorImage: string | null;
    createdAt: string;
    pinnedAt: string | null;
  }[];
  _count?: { inheritedBy: number };
};

type MobileTaskDetailResponse = TaskDetailItem & {
  imageUrl?: string | null;
  imageSignedUrl?: string | null;
};

export async function getTaskById(orgId: string, taskId: string) {
  const response = await apiFetch<{ task: MobileTaskDetailResponse }>(
    `/api/orgs/${orgId}/tasks/${taskId}`,
  );

  return response.task;
}