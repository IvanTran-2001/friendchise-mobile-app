import { apiFetch } from "../../lib/api/client";
import type { MobileInviteItem } from "../orgs/org-mode/shared/organization-api";

export type NotificationView = "all" | "unseen";

export type NotificationItem = {
  id: string;
  message: string;
  seenAt: string | null;
  createdAt: string;
};

export type NotificationAnnouncementItem = {
  id: string;
  title: string;
  description: string;
  orgName: string;
  scope: "GLOBAL" | "ORG";
  seenAt: string | null;
  createdAt: string;
};

export type NotificationFeedItem =
  | {
      kind: "invite";
      id: string;
      createdAt: string;
      invite: MobileInviteItem;
    }
  | {
      kind: "notification";
      id: string;
      createdAt: string;
      notification: NotificationItem;
    }
  | {
      kind: "announcement";
      id: string;
      createdAt: string;
      announcement: NotificationAnnouncementItem;
    };

export type NotificationFeedPage = {
  items: NotificationFeedItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  unseenCount: number;
};

export async function fetchNotificationFeed(page = 1, pageSize = 10, view: NotificationView = "all") {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("view", view);

  return apiFetch<NotificationFeedPage>(`/api/mobile/me/notifications?${params.toString()}`);
}

export async function markNotificationSeen(notificationId: string) {
  const encodedNotificationId = encodeURIComponent(notificationId);
  return apiFetch<{ ok: true }>(`/api/mobile/me/notifications/${encodedNotificationId}`, {
    method: "POST",
  });
}

export async function markAnnouncementSeen(announcementId: string) {
  const encodedAnnouncementId = encodeURIComponent(announcementId);
  return apiFetch<{ ok: true }>(`/api/mobile/me/notifications/announcements/${encodedAnnouncementId}`, {
    method: "POST",
  });
}

export async function markInviteSeen(inviteId: string) {
  const encodedInviteId = encodeURIComponent(inviteId);
  return apiFetch<{ ok: true }>(`/api/mobile/me/invites/${encodedInviteId}`, {
    method: "POST",
  });
}

export async function markAllNotificationsSeen() {
  return apiFetch<{ ok: true }>("/api/mobile/me/notifications", {
    method: "POST",
  });
}