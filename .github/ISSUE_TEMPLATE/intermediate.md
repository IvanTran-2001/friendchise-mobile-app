---
name: 🟡 Intermediate
about: Contributor-friendly task with setup notes, requirements, and submission checklist
title: "🟡 [Intermediate] Add a Logs sidebar to the admin panel"
labels: enhancement, Intermediate, help wanted, UI
---

# 🟡 Intermediate: Add a Logs sidebar to the admin panel
**Difficulty:** Intermediate

**Skill Level:** Contributors comfortable with admin UI and basic filtering

Add a `Logs` section to the admin panel so admins can browse audit logs, search entries, and filter by day or month.

## ⭐ Before You Start
If you need setup help, start with quick-start: https://friendchise.app/doc/development/quick-start
To claim this issue, include `I want to take this` anywhere in your comment. If you run into issues, leave a comment on the thread anytime you wish.

---

## 📌 Description
If the app needs audit-log browsing on mobile, create the surface under `app/(app)/orgs/[orgId]/logs/index.tsx` and wire any supporting sidebar content from `app/(app)/orgs/[orgId]/_components/`. The page should support searching, day/month filtering, and UTC timestamps.

---

## 🎯 Requirements

- Add a new `Logs` sidebar item in the admin panel.
- Show logs as a list.
- Allow searching through logs.
- Allow filtering by day or month.
- Show all dates and times in UTC.
- Keep the UI simple, readable, and consistent with the existing admin layout.

---

## ✅ Expected Result
Admins should be able to:

- Open the Logs section from the admin sidebar.
- Search for log entries.
- Filter logs by a day or a month.
- Read timestamps in UTC.

---

## 💡 Note
Likely files:
- `app/(app)/orgs/[orgId]/logs/index.tsx`
- `app/(app)/orgs/[orgId]/_components/logs-sidebar-content.tsx`
- `src/features/...`