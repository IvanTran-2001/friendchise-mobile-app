export const ROLE_PERMISSION_ACTIONS = [
  "MANAGE_MEMBERS",
  "MANAGE_ROLES",
  "MANAGE_TIMETABLE",
  "MANAGE_TASKS",
  "MANAGE_SETTINGS",
  "VIEW_TIMETABLE",
] as const;

export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];

export function formatPermissionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}