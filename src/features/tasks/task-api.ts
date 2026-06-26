import { apiFetch } from "../../lib/api/client";

export type TaskItem = {
  id: string;
  title: string;
  status: string;
};

export async function getTasks() {
  return apiFetch<TaskItem[]>("/api/mobile/tasks");
}