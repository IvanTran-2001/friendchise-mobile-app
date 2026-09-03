import { StyleSheet, View } from "react-native";
import { Card } from "./card";
import { colors, radius, spacing } from "../../src/lib/theme";

type ListSkeletonProps = {
  variant: "member" | "role";
  count?: number;
};

export function ListSkeleton({ variant, count = 4 }: ListSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`${variant}-${index}`} padding="md" style={styles.card}>
          {variant === "member" ? <MemberSkeleton /> : <RoleSkeleton />}
        </Card>
      ))}
    </View>
  );
}

function MemberSkeleton() {
  return (
    <View style={styles.memberRow}>
      <View style={styles.avatar} />

      <View style={styles.memberTextWrap}>
        <View style={styles.memberTitleRow}>
          <View style={[styles.line, styles.memberNameLine]} />
          <View style={[styles.pill, styles.tinyPill]} />
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.pill, styles.badgePill]} />
          <View style={[styles.pill, styles.badgePill]} />
        </View>
      </View>

      <View style={styles.actionPill} />
    </View>
  );
}

function RoleSkeleton() {
  return (
    <View style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleIdentity}>
          <View style={styles.roleSwatch} />
          <View style={styles.roleTitleWrap}>
            <View style={[styles.line, styles.roleNameLine]} />
            <View style={[styles.line, styles.roleSubtitleLine]} />
          </View>
        </View>

        <View style={[styles.pill, styles.roleHeaderPill]} />
      </View>

      <View style={styles.roleSection}>
        <View style={[styles.line, styles.sectionTitleLine]} />
        <View style={styles.badgeRow}>
          <View style={[styles.pill, styles.badgePill]} />
          <View style={[styles.pill, styles.badgePillWide]} />
        </View>
      </View>

      <View style={styles.roleSection}>
        <View style={[styles.line, styles.sectionTitleLine]} />
        <View style={styles.badgeRow}>
          <View style={[styles.pill, styles.badgePillWide]} />
          <View style={[styles.pill, styles.badgePill]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  memberTextWrap: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  memberNameLine: {
    width: "42%",
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  pill: {
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  line: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  tinyPill: {
    width: 34,
  },
  badgePill: {
    width: 56,
  },
  badgePillWide: {
    width: 86,
  },
  actionPill: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  roleCard: {
    gap: spacing.md,
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  roleIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: spacing.md,
  },
  roleSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceMuted,
  },
  roleTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  roleNameLine: {
    width: "56%",
  },
  roleSubtitleLine: {
    width: "32%",
  },
  roleHeaderPill: {
    width: 52,
  },
  roleSection: {
    gap: spacing.sm,
  },
  sectionTitleLine: {
    width: 74,
  },
});