# FriendChise Mobile App

Expo React Native app for the FriendChise product.

## Stack

- Expo
- React Native
- TypeScript
- Expo Router
- React Query
- Zustand
- Secure token storage with Expo SecureStore

## Start

1. Install dependencies with `pnpm install`.
2. Create a `.env` file in the project root and set `EXPO_PUBLIC_API_URL` to your FriendChise backend URL.
3. Run `pnpm start`.

## Environment

Use `.env` for local development:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

If you run the mobile app on a physical device, replace `localhost` with your computer's LAN IP address.

## Docker

You do not need Docker to run the mobile app itself. Expo runs directly on your machine. Docker only makes sense if you want to containerize the backend or supporting services.

## Current Scope

- Login screen
- Task list screen
- Shared API client
- Token storage
