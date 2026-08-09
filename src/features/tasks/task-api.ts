import { apiFetch } from "../../lib/api/client";
import { getApiUrl } from "../../lib/config";
import { getAuthToken } from "../auth/token-store";
import { normalizeRichText } from "./rich-text-utils";
import type { TaskMode, TaskSortMode } from "./task-ui";

export type CreateTaskInput = {
  title: string;
  description?: string;
  color: string;
  durationMin: number;
  peopleRequired: number;
  minWaitDays: number;
  maxWaitDays: number;
  preferredStartTimeMin?: number | null;
  imageStoragePath?: string;
};

export type CreateTaskResult =
  | { ok: true; taskId: string | null }
  | { ok: false; error: string };

async function createTaskRequest(path: string, init: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
  });
}

export async function createTask(orgId: string, input: CreateTaskInput): Promise<CreateTaskResult> {
  const formData = new FormData();
  formData.set("title", input.title.trim());
  formData.set("description", normalizeRichText(input.description));
  formData.set("color", input.color);
  formData.set("durationMin", String(input.durationMin));
  formData.set("peopleRequired", String(input.peopleRequired));
  formData.set("minWaitDays", String(input.minWaitDays));
  formData.set("maxWaitDays", String(input.maxWaitDays));
  formData.set("preferredStartTimeMin", input.preferredStartTimeMin == null ? "" : String(input.preferredStartTimeMin));

  if (input.imageStoragePath?.trim()) {
    formData.set("imageStoragePath", input.imageStoragePath.trim());
  }

  const response = await createTaskRequest(`/api/orgs/${orgId}/tasks`, {
    method: "POST",
    body: formData,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as { error?: unknown; message?: unknown; errors?: unknown }).error ??
          (payload as { error?: unknown; message?: unknown; errors?: unknown }).message ??
          (payload as { error?: unknown; message?: unknown; errors?: unknown }).errors
        : null;

    return {
      ok: false,
      error:
        typeof message === "string"
          ? message
          : "Failed to create task.",
    };
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const data = payload as { taskId?: unknown; task?: { id?: unknown } };
    if (typeof data.taskId === "string") {
      return { ok: true, taskId: data.taskId };
    }
    if (data.task && typeof data.task.id === "string") {
      return { ok: true, taskId: data.task.id };
    }
  }

  return { ok: true, taskId: null };
}

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
  options: { mode?: TaskMode; sort?: TaskSortMode; search?: string } = {},
) {
  const activeOrg = orgId
    ? { orgId }
    : await apiFetch<MobileOrganizationResponse>("/api/mobile/me/organization");

  const tasks: TaskItem[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams();
    if (options.mode && options.mode !== "shared") {
      params.set("mode", options.mode);
    }
    if (options.sort && options.sort !== "name-asc") {
      params.set("sort", options.sort);
    }
    if (options.search?.trim()) {
      params.set("search", options.search.trim().toLowerCase());
    }
    if (cursor) {
      params.set("cursor", cursor);
    }
    params.set("limit", "100");

    const response = await apiFetch<{ tasks: MobileTaskResponse[]; nextCursor: string | null }>(
      `/api/orgs/${activeOrg.orgId}/tasks/paginated?${params.toString()}`,
    );

    tasks.push(
      ...response.tasks.map((task) => ({
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
      })),
    );
    cursor = response.nextCursor;
  } while (cursor);

  return tasks;
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