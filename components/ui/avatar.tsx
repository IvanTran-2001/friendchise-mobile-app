import { Image, StyleSheet, View } from "react-native";
import { colors } from "../../src/lib/theme";
import { Text } from "./text";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  imageUri?: string | null;
  label: string;
  size?: AvatarSize;
  tintId?: string | null;
};

const sizes: Record<AvatarSize, number> = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 72,
};

const fontSizes: Record<AvatarSize, number> = {
  xs: 10,
  sm: 11,
  md: 13,
  lg: 17,
  xl: 24,
};

/** Deterministic accent color derived from an id, used when there is no image. */
function tintFromId(id: string | null | undefined): string {
  if (!id) {
    return colors.accentMuted;
  }

  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return `hsl(${hash % 360} 62% 45%)`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Circular avatar with a photo, or a colored initials fallback when no
 * image is available. Used for users and organizations alike.
 *
 * @example <Avatar imageUri={user.image} label={getInitials(user.name)} />
 */
export function Avatar({ imageUri, label, size = "md", tintId }: AvatarProps) {
  const dimension = sizes[size];
  const dimensionStyle = { width: dimension, height: dimension, borderRadius: dimension / 2 };

  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[styles.image, dimensionStyle]} />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle, { backgroundColor: tintFromId(tintId ?? label) }]}>
      <Text style={[styles.fallbackText, { fontSize: fontSizes[size] }]} tone="inverse">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceMuted,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontWeight: "800",
  },
});
