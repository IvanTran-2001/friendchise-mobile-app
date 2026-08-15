/**
 * Friendchise mobile design tokens.
 *
 * This is the single source of truth for color, spacing, radius, typography
 * and shadow values used across the app. Screens and components should pull
 * from these tokens instead of hardcoding hex values or magic numbers so the
 * whole app stays visually consistent and easy to re-theme later.
 */

const palette = {
  white: "#FFFFFF",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  slate950: "#0B1220",
  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blue800: "#1E40AF",
  amber50: "#FFFBEB",
  amber100: "#FEF3C7",
  amber600: "#D97706",
  amber700: "#B45309",
  emerald50: "#ECFDF5",
  emerald100: "#D1FAE5",
  emerald600: "#059669",
  emerald700: "#047857",
  red50: "#FEF2F2",
  red100: "#FEE2E2",
  red600: "#DC2626",
  red700: "#B91C1C",
} as const;

export const colors = {
  // Surfaces
  background: palette.slate50,
  surface: palette.white,
  surfaceMuted: palette.slate100,
  surfaceSunken: palette.slate100,
  overlay: "rgba(15, 23, 42, 0.5)",

  // Borders
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(148, 163, 184, 0.32)",
  hairline: "rgba(226, 232, 240, 0.95)",

  // Text
  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  // slate500 (not slate400) so low-emphasis text/icons stay readable in
  // bright, real-world environments (kitchens, warehouses, direct sunlight).
  textTertiary: palette.slate500,
  textInverse: palette.white,
  textDisabled: palette.slate300,

  // Brand / accent
  accent: palette.blue700,
  accentStrong: palette.blue800,
  accentMuted: palette.blue600,
  accentSoft: palette.blue50,
  accentSoftBorder: "rgba(191, 219, 254, 0.9)",
  accentOnAccent: palette.white,

  // Status
  success: palette.emerald700,
  successSoft: palette.emerald50,
  successBorder: "rgba(110, 231, 183, 0.55)",
  warning: palette.amber700,
  warningSoft: palette.amber50,
  warningBorder: "rgba(252, 211, 77, 0.6)",
  danger: palette.red700,
  dangerSoft: palette.red50,
  dangerBorder: "rgba(252, 165, 165, 0.6)",

  // Misc
  shadow: palette.slate900,
  dark: palette.slate950,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 26,
  pill: 999,
} as const;

export const hitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

type TextToken = {
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase";
};

export const typography: Record<string, TextToken> = {
  display: { fontSize: 30, fontWeight: "800", lineHeight: 36, letterSpacing: -0.4 },
  title: { fontSize: 22, fontWeight: "800", lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "700", lineHeight: 22, letterSpacing: -0.1 },
  bodyLarge: { fontSize: 15, fontWeight: "500", lineHeight: 21 },
  body: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  captionStrong: { fontSize: 12, fontWeight: "700", lineHeight: 16 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
};

type ShadowToken = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

export const shadows: Record<"xs" | "sm" | "md" | "lg", ShadowToken> = {
  xs: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.09,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 4,
  },
};

/** Shared minimum size for comfortable, accessible tap targets. */
export const minTapTarget = 44;

/** @deprecated use `colors.background` instead. Kept for backward compatibility. */
export const APP_SHELL_BG = colors.background;

const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  hitSlop,
  minTapTarget,
} as const;

export default theme;