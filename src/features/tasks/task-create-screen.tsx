import { useEffect } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Sparkles } from "lucide-react-native";
import { Screen } from "../../../components/ui/screen";
import { ScreenHeader } from "../../../components/ui/screen-header";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { TextField } from "../../../components/ui/text-field";
import { RichTextField } from "../../../components/ui/rich-text-field";
import { ImagePicker } from "../../../components/ui/image-picker";
import { Text } from "../../../components/ui/text";
import { colors, spacing } from "../../lib/theme";
import { createTask, updateTask, type CreateTaskInput, type TaskDetailItem } from "./task-api";
import { useTaskCreateDraftStore } from "./task-create-draft-store";

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
  task?: TaskDetailItem | null;
  onCancel: () => void;
  onSubmitted: (taskId: string | null) => void;
};

type TaskSaveResult =
  | { ok: true; taskId: string | null }
  | { ok: false; error: string };

type TaskSaveInput = Omit<CreateTaskInput, "minWaitDays" | "maxWaitDays"> & {
  minWaitDays?: number;
  maxWaitDays?: number;
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

export function TaskCreateScreen({ orgId, task, onCancel, onSubmitted }: TaskCreateScreenProps) {
  const queryClient = useQueryClient();
  const isEditing = !!task;
  const {
    title,
    description,
    selectedImage,
    color,
    durationMin,
    peopleRequired,
    minWaitDays,
    maxWaitDays,
    formError,
    initializeDraft,
    setTitle,
    setDescription,
    setSelectedImage,
    setColor,
    setDurationMin,
    setPeopleRequired,
    setMinWaitDays,
    setMaxWaitDays,
    setFormError,
  } = useTaskCreateDraftStore();

  useEffect(() => {
    initializeDraft(task);
  }, [initializeDraft, orgId, task]);

  const createTaskMutation = useMutation<TaskSaveResult, Error, TaskSaveInput>({
    mutationFn: async (input: TaskSaveInput): Promise<TaskSaveResult> => {
      if (!orgId) {
        return { ok: false, error: "Organization is unavailable." };
      }

      if (task) {
        const result = await updateTask(orgId, task.id, input);
        if (!result.ok) {
          return { ok: false as const, error: result.error };
        }

        return { ok: true as const, taskId: task.id };
      }

      if (input.minWaitDays == null || input.maxWaitDays == null) {
        return { ok: false, error: "Wait days are unavailable." };
      }

      return createTask(orgId, {
        title: input.title,
        description: input.description,
        color: input.color,
        durationMin: input.durationMin,
        peopleRequired: input.peopleRequired,
        minWaitDays: input.minWaitDays,
        maxWaitDays: input.maxWaitDays,
        preferredStartTimeMin: input.preferredStartTimeMin,
        imageStoragePath: input.imageStoragePath,
      });
    },
    onSuccess: async (result) => {
      if (!result.ok || !orgId) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks", orgId] });
      if (task) {
        await queryClient.invalidateQueries({ queryKey: ["task", orgId, task.id] });
      }

      onSubmitted(result.taskId ?? task?.id ?? null);
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

    const trimmedMinWaitDays = minWaitDays.trim();
    const parsedMinWaitDays = trimmedMinWaitDays
      ? toNonNegativeInt(trimmedMinWaitDays)
      : isEditing
        ? undefined
        : null;
    if (parsedMinWaitDays === null) {
      setFormError("Min wait days must be a whole number of 0 or more.");
      return;
    }

    const trimmedMaxWaitDays = maxWaitDays.trim();
    const parsedMaxWaitDays = trimmedMaxWaitDays
      ? toNonNegativeInt(trimmedMaxWaitDays)
      : isEditing
        ? undefined
        : null;
    if (parsedMaxWaitDays === null) {
      setFormError("Max wait days must be a whole number of 0 or more.");
      return;
    }

    if (
      parsedMinWaitDays !== undefined &&
      parsedMaxWaitDays !== undefined &&
      parsedMaxWaitDays < parsedMinWaitDays
    ) {
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
        ...(parsedMinWaitDays !== undefined ? { minWaitDays: parsedMinWaitDays } : {}),
        ...(parsedMaxWaitDays !== undefined ? { maxWaitDays: parsedMaxWaitDays } : {}),
      });

      if (!result.ok) {
        Alert.alert(isEditing ? "Failed to update task" : "Failed to create task", result.error);
      }
    } catch (error) {
      Alert.alert(isEditing ? "Failed to update task" : "Failed to create task", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <Screen scroll keyboardAvoiding contentStyle={styles.content}>
      <ScreenHeader
        kicker="Tasks"
        title={isEditing ? "Edit task" : "Create task"}
        subtitle={isEditing ? "Update the task details" : "Add recipes, operations & tasks"}
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
          leftIcon={<ArrowLeft size={16} color={colors.textPrimary} />}
          style={styles.actionButton}
          onPress={onCancel}
        />
        <Button
          label={createTaskMutation.isPending ? (isEditing ? "Saving…" : "Posting…") : isEditing ? "Save task" : "Post task"}
          loading={createTaskMutation.isPending}
          loadingLabel={isEditing ? "Saving…" : "Posting…"}
          leftIcon={<Sparkles size={16} color={colors.textInverse} />}
          style={styles.actionButton}
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
  actionButton: {
    flex: 1,
  },
});