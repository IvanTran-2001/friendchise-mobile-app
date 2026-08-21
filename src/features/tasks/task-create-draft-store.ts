import { create } from "zustand";
import { type SelectedImage } from "../../../components/ui/image-picker";
import { colors } from "../../lib/theme";
import type { TaskDetailItem } from "./task-api";

type TaskCreateDraftSnapshot = {
  title: string;
  description: string;
  selectedImage: SelectedImage | null;
  color: string;
  durationMin: string;
  peopleRequired: string;
  minWaitDays: string;
  maxWaitDays: string;
  formError: string | null;
};

type TaskCreateDraftState = TaskCreateDraftSnapshot & {
  initializeDraft: (task?: TaskDetailItem | null) => void;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setSelectedImage: (value: SelectedImage | null) => void;
  setColor: (value: string) => void;
  setDurationMin: (value: string) => void;
  setPeopleRequired: (value: string) => void;
  setMinWaitDays: (value: string) => void;
  setMaxWaitDays: (value: string) => void;
  setFormError: (value: string | null) => void;
};

const DEFAULT_TASK_CREATE_DRAFT: TaskCreateDraftSnapshot = {
  title: "",
  description: "",
  selectedImage: null,
  color: colors.accent,
  durationMin: "30",
  peopleRequired: "1",
  minWaitDays: "1",
  maxWaitDays: "1",
  formError: null,
};

function buildSelectedImage(task?: TaskDetailItem | null): SelectedImage | null {
  if (!task?.imageUrl || !task.imageSignedUrl) {
    return null;
  }

  return {
    storagePath: task.imageUrl,
    signedUrl: task.imageSignedUrl,
    name: task.imageUrl.split("/").pop() ?? null,
  };
}

function buildDraft(task?: TaskDetailItem | null): TaskCreateDraftSnapshot {
  if (!task) {
    return DEFAULT_TASK_CREATE_DRAFT;
  }

  return {
    title: task.name,
    description: task.description ?? "",
    selectedImage: buildSelectedImage(task),
    color: task.color,
    durationMin: String(task.durationMin),
    peopleRequired: String(task.minPeople),
    minWaitDays: task.minWaitDays == null ? "" : String(task.minWaitDays),
    maxWaitDays: task.maxWaitDays == null ? "" : String(task.maxWaitDays),
    formError: null,
  };
}

export const useTaskCreateDraftStore = create<TaskCreateDraftState>()((set) => ({
  ...DEFAULT_TASK_CREATE_DRAFT,
  initializeDraft: (task) => set(buildDraft(task)),
  setTitle: (value) => set({ title: value }),
  setDescription: (value) => set({ description: value }),
  setSelectedImage: (value) => set({ selectedImage: value }),
  setColor: (value) => set({ color: value }),
  setDurationMin: (value) => set({ durationMin: value }),
  setPeopleRequired: (value) => set({ peopleRequired: value }),
  setMinWaitDays: (value) => set({ minWaitDays: value }),
  setMaxWaitDays: (value) => set({ maxWaitDays: value }),
  setFormError: (value) => set({ formError: value }),
}));