import type { ExpoConfig, ConfigContext } from "expo/config";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_ALLOW_HTTP_AUTH?: string;
  };
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ios: {
    ...(config.ios ?? {}),
    usesAppleSignIn: true,
  },
  extra: {
    ...(config.extra ?? {}),
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    allowHttpAuth: process.env.EXPO_PUBLIC_ALLOW_HTTP_AUTH === "true",
  },
} as ExpoConfig);
