export type TaskMode = "shared" | "list" | "available";
export type TaskViewMode = "list" | "feed" | "card";
export type TaskSortMode =
  | "name-asc"
  | "name-desc"
  | "duration-asc"
  | "duration-desc"
  | "people-asc"
  | "people-desc";

export type TaskUiPreferences = {
  mode: TaskMode;
  viewMode: TaskViewMode;
  sortMode: TaskSortMode;
};