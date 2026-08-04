# FriendChise Mobile App

- Expo React Native app for FriendChise.
- Use TypeScript, Expo Router, React Query, and Zustand.
- Keep reusable UI in `components/` and feature logic in `src/features/`.
- Keep route files in `app/` focused on navigation and screen composition.
- Treat the backend as an external HTTP API; do not depend on Next.js server actions.
- Keep the scan-to-task feature guidance in `.github/instructions/task-specifics/scan-to-task.instructions.md` because we may build it on mobile later.
- Prefer the shared design tokens in `src/lib/theme.ts` and shared primitives in `components/ui`.
- Start with auth and the task flow before adding anything else.