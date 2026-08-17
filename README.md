# FriendChise Mobile App

Expo React Native app for the FriendChise product. Visit friendchise Web [Github](https://github.com/IvanTran-2001/FriendChise) for reference.

## Quick Start

See the [mobile quick start](https://friendchise.app/doc/getting-started/quick-start-mobile-app) for the step-by-step setup guide.

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

Use `.env` for local development. The app expects `EXPO_PUBLIC_API_URL` to be set for every environment.

For the hosted FriendChise app, use:

```bash
EXPO_PUBLIC_API_URL=https://friendchise.app
```

For local development on a physical mobile device, use your computer's network IP address instead of `localhost`. For example:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.97:3000
```

The IP address may be different on your machine. When starting the backend locally, use the `Network` URL shown in the terminal, such as:

```bash
Network: http://192.168.1.97:3000
```

If you use `localhost` on a physical phone, the app will look for the backend on the phone itself instead of your computer, so the mobile app will not be able to connect.

## Current Scope

- Login screen
- Task list screen
- Shared API client
- Token storage
