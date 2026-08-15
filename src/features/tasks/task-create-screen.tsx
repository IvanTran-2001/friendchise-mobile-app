import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Sparkles } from "lucide-react-native";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { TextField } from "../../../components/ui/text-field";
import { RichTextField } from "../../../components/ui/rich-text-field";
import { ImagePicker, type SelectedImage } from "../../../components/ui/image-picker";
import { Text } from "../../../components/ui/text";
import { colors, spacing } from "../../lib/theme";
import { createTask, type CreateTaskInput } from "./task-api";

const COLOR_OPTIONS = [
  { name: "Accent", value: colors.accent },
  { name: "Success", value: colors.success },
  { name: "Warning", value: colors.warning },
  { name: "Danger", value: colors.danger },
  { name: "Muted", value: colors.textSecondary },
  { name: "Primary", value: colors.textPrimary },
];

type TaskCreateScreenProps = {
  orgId?: string;
  onCancel: () => void;
  onCreated: (taskId: string | null) => void;
};

function toPositiveInt(value: string) {
  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function toNonNegativeInt(value: string) {
  const trimmed = value.trim();
  if (!/^(0|[1-9]\d*)$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function TaskCreateScreen({ orgId, onCancel, onCreated }: TaskCreateScreenProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [durationMin, setDurationMin] = useState("30");
  const [peopleRequired, setPeopleRequired] = useState("1");
  const [minWaitDays, setMinWaitDays] = useState("1");
  const [maxWaitDays, setMaxWaitDays] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const createTaskMutation = useMutation({
    mutationFn: async (input: CreateTaskInput) => createTask(orgId!, input),
    onSuccess: async (result) => {
      if (!result.ok || !orgId) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks", orgId] });

      onCreated(result.taskId);
    },
  });

  const canSubmit = !!orgId && !!title.trim() && !createTaskMutation.isPending;

  const handleSubmit = async () => {
    if (!orgId || !title.trim()) {
      return;
    }

    const parsedDurationMin = toPositiveInt(durationMin);
    if (parsedDurationMin === null) {
      setFormError("Duration must be a whole number greater than 0.");
      return;
    }

    const parsedPeopleRequired = toPositiveInt(peopleRequired);
    if (parsedPeopleRequired === null) {
      setFormError("People must be a whole number greater than 0.");
      return;
    }

    const parsedMinWaitDays = toNonNegativeInt(minWaitDays);
    if (parsedMinWaitDays === null) {
      setFormError("Min wait days must be a whole number of 0 or more.");
      return;
    }

    const parsedMaxWaitDays = toNonNegativeInt(maxWaitDays);
    if (parsedMaxWaitDays === null) {
      setFormError("Max wait days must be a whole number of 0 or more.");
      return;
    }

    if (parsedMaxWaitDays < parsedMinWaitDays) {
      setFormError("Max wait days must be at least min wait days.");
      return;
    }

    setFormError(null);
    try {
      const result = await createTaskMutation.mutateAsync({
        title,
        description,
        imageStoragePath: selectedImage?.storagePath,
        color,
        durationMin: parsedDurationMin,
        peopleRequired: parsedPeopleRequired,
        minWaitDays: parsedMinWaitDays,
        maxWaitDays: parsedMaxWaitDays,
      });

      if (!result.ok) {
        Alert.alert("Failed to create task", result.error);
      }
    } catch (error) {
      Alert.alert("Failed to create task", error instanceof Error ? error.message : "Please try again.");
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
          {orgId ? (
            <ImagePicker
              orgId={orgId}
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
              const active = option.value === color;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setColor(option.value)}
                  style={({ pressed }) => [
                    styles.colorSwatch,
                    { backgroundColor: option.value },
                    active ? styles.colorSwatchActive : null,
                    pressed ? styles.colorSwatchPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option.name} color (${option.value})`}
                  accessibilityState={{ selected: active }}
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
          onPress={onCancel}
        />
        <Button
          label={createTaskMutation.isPending ? "Posting…" : "Post task"}
          fullWidth
          loading={createTaskMutation.isPending}
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
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: {
    borderColor: colors.textPrimary,
  },
  colorSwatchPressed: {
    opacity: 0.82,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});