import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Sparkles } from "lucide-react-native";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DropdownSelect, type DropdownSelectItem } from "../../../components/ui/dropdown-select";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { TextField } from "../../../components/ui/text-field";
import { Text } from "../../../components/ui/text";
import { colors, radius, spacing } from "../../lib/theme";
import { createOrganization } from "./organization-api";

const ALL_DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

type DayKey = (typeof ALL_DAYS)[number]["key"];

const TIMEZONE_OPTIONS: DropdownSelectItem[] = [
  { id: "Australia/Sydney", name: "Sydney" },
  { id: "Australia/Melbourne", name: "Melbourne" },
  { id: "Australia/Perth", name: "Perth" },
  { id: "Pacific/Auckland", name: "Auckland" },
  { id: "Asia/Singapore", name: "Singapore" },
  { id: "Asia/Tokyo", name: "Tokyo" },
  { id: "Europe/London", name: "London" },
  { id: "Europe/Paris", name: "Paris" },
  { id: "America/New_York", name: "New York" },
  { id: "America/Chicago", name: "Chicago" },
  { id: "America/Denver", name: "Denver" },
  { id: "America/Los_Angeles", name: "Los Angeles" },
];

function toMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function useCreateOrgState() {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTimezone = TIMEZONE_OPTIONS.some((item) => item.id === systemTimezone)
    ? systemTimezone
    : "";

  const [title, setTitle] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [address, setAddress] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [days, setDays] = useState<DayKey[]>(["mon", "tue", "wed", "thu", "fri"]);

  return {
    title,
    setTitle,
    timezone,
    setTimezone,
    address,
    setAddress,
    openTime,
    setOpenTime,
    closeTime,
    setCloseTime,
    days,
    setDays,
  };
}

function buildPayload(state: ReturnType<typeof useCreateOrgState>) {
  const parseOptionalTime = (label: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = toMinutes(trimmed);
    if (parsed === null) {
      throw new Error(`${label} must be in HH:MM format.`);
    }

    return parsed;
  };

  const openTimeMin = parseOptionalTime("Start time", state.openTime);
  const closeTimeMin = parseOptionalTime("End time", state.closeTime);

  if (openTimeMin !== undefined && closeTimeMin !== undefined && closeTimeMin <= openTimeMin) {
    throw new Error("Close time must be after start time");
  }

  return {
    title: state.title.trim(),
    timezone: state.timezone || undefined,
    address: state.address.trim() || undefined,
    operatingDays: state.days,
    openTimeMin,
    closeTimeMin,
  };
}

export function OrgCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const state = useCreateOrgState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const canSubmit = state.title.trim().length > 0;

  const handleCancel = () => {
    router.replace("/(app)/orgs");
  };

  const handleSubmit = async () => {
    setTouched(true);
    setError(null);

    const title = state.title.trim();
    if (!title) {
      setError("Organization name is required.");
      return;
    }
    if (title.length > 100) {
      setError("Organization name must be 100 characters or less.");
      return;
    }

    setLoading(true);
    try {
      const result = await createOrganization(buildPayload(state));
      await queryClient.invalidateQueries({ queryKey: ["mobile-orgs"] });
      router.replace(`/(app)/orgs/${result.organization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding>
      <ScreenHeader
        kicker="Organization"
        title="Create organization"
        subtitle="Set up a new place to manage tasks, tools, and schedules."
      />

      <View style={styles.heroCardWrap}>
        <Card padding="lg" elevation="md" style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <Sparkles size={20} strokeWidth={2.2} color={colors.accent} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text variant="bodyStrong">New organization</Text>
              <Text variant="caption" tone="secondary">
                Friendly setup, optimized for phone screens.
              </Text>
            </View>
          </View>

          <TextField
            label="Org name"
            value={state.title}
            onChangeText={state.setTitle}
            placeholder="e.g. Acme Coffee"
            autoCapitalize="words"
            maxLength={100}
            helperText="Keep it short and recognizable."
            error={touched && !canSubmit ? "Organization name is required." : undefined}
            containerStyle={styles.field}
          />

          <DropdownSelect
            label="Time zone"
            selectedId={state.timezone}
            items={TIMEZONE_OPTIONS}
            onSelect={state.setTimezone}
            helperText="Used for schedules and reminders."
          />

          <TextField
            label="Location"
            value={state.address}
            onChangeText={state.setAddress}
            placeholder="e.g. 123 Main St"
            autoCapitalize="words"
            containerStyle={styles.field}
          />

          <View style={styles.row}>
            <TextField
              label="Start time"
              value={state.openTime}
              onChangeText={state.setOpenTime}
              placeholder="09:00"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              containerStyle={styles.rowField}
            />
            <TextField
              label="End time"
              value={state.closeTime}
              onChangeText={state.setCloseTime}
              placeholder="17:00"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              containerStyle={styles.rowField}
            />
          </View>

          <View style={styles.field}>
            <Text variant="label" tone="secondary" style={styles.label}>
              Operating days
            </Text>
            <View style={styles.dayWrap}>
              {ALL_DAYS.map((day) => {
                const selected = state.days.includes(day.key);
                return (
                  <Pressable
                    key={day.key}
                    accessibilityRole="button"
                    accessibilityLabel={day.label}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      state.setDays(
                        selected ? state.days.filter((current) => current !== day.key) : [...state.days, day.key],
                      );
                    }}
                    style={({ pressed }) => [
                      styles.dayChip,
                      selected && styles.dayChipSelected,
                      pressed && styles.dayChipPressed,
                    ]}
                  >
                    <Text variant="label" style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? (
            <Text variant="caption" tone="danger" style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              label="Create organization"
              onPress={() => void handleSubmit()}
              loading={loading}
              loadingLabel="Creating..."
              fullWidth
              leftIcon={<Plus size={16} strokeWidth={2.2} color={colors.textInverse} />}
            />
            <Button
              label="Back to organizations"
              variant="secondary"
              onPress={handleCancel}
              fullWidth
              leftIcon={<ChevronLeft size={16} strokeWidth={2.2} color={colors.textPrimary} />}
            />
            <Pressable onPress={() => router.push("/(app)/orgs/invite")} style={styles.inviteLink}>
              <Text variant="caption" tone="secondary" align="center">
                Have an invite? Open the invite page.
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCardWrap: {
    paddingBottom: spacing.xl,
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  heroTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  field: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
  label: {
    marginBottom: spacing.sm,
  },
  dayWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dayChip: {
    minWidth: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoftBorder,
  },
  dayChipPressed: {
    opacity: 0.85,
  },
  dayLabel: {
    color: colors.textPrimary,
  },
  dayLabelSelected: {
    color: colors.accent,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  inviteLink: {
    paddingVertical: spacing.xs,
  },
});
