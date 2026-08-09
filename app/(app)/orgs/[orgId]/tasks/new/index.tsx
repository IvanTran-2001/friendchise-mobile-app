import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Sparkles } from "lucide-react-native";
import { Screen } from "../../../../../../components/ui/screen";
import { ScreenHeader } from "../../../../../../components/ui/screen-header";
import { Card } from "../../../../../../components/ui/card";
import { Button } from "../../../../../../components/ui/button";
import { TextField } from "../../../../../../components/ui/text-field";
import { RichTextField } from "../../../../../../components/ui/rich-text-field";
import { ImagePicker } from "../../../../../../components/ui/image-picker";
import { Text } from "../../../../../../components/ui/text";
import { colors, spacing } from "../../../../../../src/lib/theme";
import { createTask } from "../../../../../../src/features/tasks/task-api";

const COLOR_OPTIONS = [colors.accent, colors.success, colors.warning, colors.danger, colors.textSecondary, colors.textPrimary];

function toPositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNonNegativeInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default function TaskCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const orgId = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const resolvedOrgId = orgId && !orgId.startsWith("[") ? orgId : undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ storagePath: string; signedUrl: string; name?: string | null } | null>(null);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [durationMin, setDurationMin] = useState("30");
  const [peopleRequired, setPeopleRequired] = useState("1");
  const [minWaitDays, setMinWaitDays] = useState("1");
  const [maxWaitDays, setMaxWaitDays] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = !!resolvedOrgId && !!title.trim() && !isSubmitting;

  const handleSubmit = async () => {
    if (!resolvedOrgId || !title.trim()) {
      return;
    }

    const parsedMinWaitDays = toNonNegativeInt(minWaitDays, 0);
    const parsedMaxWaitDays = toNonNegativeInt(maxWaitDays, 0);
    if (parsedMaxWaitDays < parsedMinWaitDays) {
      setFormError("Max wait days must be at least min wait days.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await createTask(resolvedOrgId, {
        title,
        description,
        imageStoragePath: selectedImage?.storagePath,
        color,
        durationMin: toPositiveInt(durationMin, 30),
        peopleRequired: toPositiveInt(peopleRequired, 1),
        minWaitDays: parsedMinWaitDays,
        maxWaitDays: parsedMaxWaitDays,
      });

      if (!result.ok) {
        Alert.alert("Failed to create task", result.error);
        return;
      }

      Alert.alert("Task created", "Your new task is ready.", [
        {
          text: "View tasks",
          onPress: () => router.replace(`/(app)/orgs/${resolvedOrgId}/tasks`),
        },
        ...(result.taskId
          ? [
              {
                text: "Open task",
                onPress: () => router.replace(`/(app)/orgs/${resolvedOrgId}/tasks/${result.taskId}`),
              },
            ]
          : []),
      ]);
    } catch (error) {
      Alert.alert("Failed to create task", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding contentStyle={styles.content}>
      <ScreenHeader
        kicker="Tasks"
        title="Create task"
        subtitle="Add recipes, operations & tasks"
      />

      <Card padding="lg" style={styles.card}>
        <View style={styles.section}>
          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Deep clean kitchen"
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        <View style={styles.section}>
          <RichTextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add details, steps, or notes…"
            helperText="Format with bold, italic, underline, or lists."
          />
        </View>

        <View style={styles.section}>
          {resolvedOrgId ? (
            <ImagePicker
              orgId={resolvedOrgId}
              value={selectedImage}
              onChange={setSelectedImage}
              helperText="Choose an existing org image or upload one for this task."
            />
          ) : (
            <Text variant="caption" tone="secondary">
              We could not resolve this organization, so image selection and submission are unavailable.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="label" tone="secondary" style={styles.label}>
            Color
          </Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((option) => {
              const active = option === color;
              return (
                <Pressable
                  key={option}
                  onPress={() => setColor(option)}
                  style={({ pressed }) => [
                    styles.colorSwatch,
                    { backgroundColor: option },
                    active ? styles.colorSwatchActive : null,
                    pressed ? styles.colorSwatchPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${option}`}
                >
                  {active ? <Check size={16} color={colors.textInverse} strokeWidth={2.6} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.grid}>
          <TextField
            label="Duration (min)"
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="number-pad"
            placeholder="30"
          />
          <TextField
            label="People"
            value={peopleRequired}
            onChangeText={setPeopleRequired}
            keyboardType="number-pad"
            placeholder="1"
          />
        </View>

        <View style={styles.grid}>
          <TextField
            label="Min wait days"
            value={minWaitDays}
            onChangeText={setMinWaitDays}
            keyboardType="number-pad"
            placeholder="1"
          />
          <TextField
            label="Max wait days"
            value={maxWaitDays}
            onChangeText={setMaxWaitDays}
            keyboardType="number-pad"
            placeholder="1"
          />
        </View>
        {formError ? (
          <Text variant="caption" tone="danger">
            {formError}
          </Text>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Cancel"
          variant="outline"
          fullWidth
          leftIcon={<ArrowLeft size={16} color={colors.textPrimary} />}
          onPress={() => router.back()}
        />
        <Button
          label={isSubmitting ? "Posting…" : "Post task"}
          fullWidth
          loading={isSubmitting}
          loadingLabel="Posting…"
          leftIcon={<Sparkles size={16} color={colors.textInverse} />}
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    marginBottom: 0,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.12)",
  },
  colorSwatchActive: {
    transform: [{ scale: 1.04 }],
  },
  colorSwatchPressed: {
    opacity: 0.85,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
});