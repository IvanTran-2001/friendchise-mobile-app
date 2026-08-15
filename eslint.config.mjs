import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  {
    ignores: ["eslint.config.mjs", "**/node_modules/**", "**/.expo/**", "**/dist/**"],
  },
]);