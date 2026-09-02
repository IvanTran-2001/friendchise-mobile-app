import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, FileText, Image as ImageIcon, X } from "lucide-react-native";
import { Screen } from "../../../../components/ui/screen";
import { ScreenHeader } from "../../../../components/ui/screen-header";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { TextField } from "../../../../components/ui/text-field";
import { Text } from "../../../../components/ui/text";
import { LoadingState } from "../../../../components/ui/state-views";
import { colors, spacing } from "../../../lib/theme";
import { pickScanFile, type ScanSourceOrigin } from "./scan-source-picker";
import {
  useScanToTaskWorkflowStore,
  type DraftForm,
  type DraftReviewItem,
  type ReviewItem,
  type SelectedFile,
} from "./scan-to-task-store";
import {
  clearScanResult,
  type ConfirmScanDraftInput,
  confirmScanDraft,
  runScanToTask,
  uploadScanSource,
  SCAN_TO_TASK_MAX_FILE_BYTES,
} from "./scan-to-task-api";

function toPositiveInt(value: string) {
  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function toNonNegativeInt(value: string) {
  const trimmed = value.trim();
  if (!/^(0|[1-9]\d*)$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function formatFileSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ScanToTaskScreenProps = {
  orgId?: string;
};

type ConfirmDraftMutationVariables = {
  item: DraftReviewItem;
  payload: ConfirmScanDraftInput;
  savedTitle: string;
};

type ClearReviewItemMutationVariables = {
  resultId: string;
  kind: ReviewItem["kind"];
};

/**
 * Mobile Scan to Task screen: pick a photo or PDF, scan it into draft tasks,
 * then review/edit and save each draft into the org's task list.
 *
 * Mirrors the web `/tools/scan-to-task` flow, with two intentional v1
 * simplifications documented in the mobile docs: one file per scan (web
 * supports up to 12 at once) and no merge/duplicate-adjudication UI.
 */
export function ScanToTaskScreen({ orgId }: ScanToTaskScreenProps) {
  const queryClient = useQueryClient();
  const selectedFile = useScanToTaskWorkflowStore((state) => state.selectedFile);
  const instruction = useScanToTaskWorkflowStore((state) => state.instruction);
  const pickError = useScanToTaskWorkflowStore((state) => state.pickError);
  const scanError = useScanToTaskWorkflowStore((state) => state.scanError);
  const reviewItems = useScanToTaskWorkflowStore((state) => state.reviewItems);
  const stage = useScanToTaskWorkflowStore((state) => state.stage);
  const setSelectedFile = useScanToTaskWorkflowStore((state) => state.setSelectedFile);
  const setInstruction = useScanToTaskWorkflowStore((state) => state.setInstruction);
  const setPickError = useScanToTaskWorkflowStore((state) => state.setPickError);
  const setScanError = useScanToTaskWorkflowStore((state) => state.setScanError);
  const setReviewItems = useScanToTaskWorkflowStore((state) => state.setReviewItems);
  const setStage = useScanToTaskWorkflowStore((state) => state.setStage);
  const updateReviewItem = useScanToTaskWorkflowStore((state) => state.updateReviewItem);
  const removeReviewItem = useScanToTaskWorkflowStore((state) => state.removeReviewItem);

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !selectedFile) throw new Error("Select a file first.");

      setStage("uploading");
      const source = await uploadScanSource(orgId, {
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType,
        fileSize: selectedFile.fileSize,
      });

      setStage("scanning");
      return runScanToTask(orgId, [source], instruction);
    },
    onSuccess: (results) => {
      setStage("idle");
      setSelectedFile(null);
      setReviewItems(
        results.map((result) =>
          result.ok
            ? {
                kind: "draft" as const,
                resultId: result.resultId,
                fileName: result.fileName,
                saving: false,
                discarding: false,
                error: null,
                form: {
                  title: result.draft.title,
                  description: result.draft.description,
                  summary: result.draft.summary,
                  sourceText: result.draft.sourceText,
                  color: result.draft.color,
                  durationMin: String(result.draft.durationMin),
                  peopleRequired: String(result.draft.peopleRequired),
                  minWaitDays: String(result.draft.minWaitDays),
                  maxWaitDays: String(result.draft.maxWaitDays),
                },
              }
            : {
                kind: "failed" as const,
                resultId: result.resultId,
                fileName: result.fileName,
                message: result.error,
                dismissing: false,
              },
        ),
      );
    },
    onError: (error) => {
      setStage("idle");
      setScanError(error instanceof Error ? error.message : "Failed to scan file.");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ payload }: ConfirmDraftMutationVariables) => {
      if (!orgId) {
        throw new Error("Select an organization first.");
      }

      return confirmScanDraft(orgId, payload);
    },
    onMutate: ({ item }) => {
      updateReviewItem(item.resultId, (entry) =>
        entry.kind === "draft"
          ? {
              ...entry,
              saving: true,
              error: null,
            }
          : entry,
      );
    },
    onSuccess: async (_taskId, variables) => {
      if (!orgId) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks", orgId] });
      removeReviewItem(variables.item.resultId);
      Alert.alert("Saved", `"${variables.savedTitle}" was added to your task list.`);
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "Failed to save task.";
      updateReviewItem(variables.item.resultId, (entry) =>
        entry.kind === "draft"
          ? {
              ...entry,
              saving: false,
              error: message,
            }
          : entry,
      );
    },
  });

  const clearMutation = useMutation({
    mutationFn: async ({ resultId }: ClearReviewItemMutationVariables) => {
      if (!orgId) {
        throw new Error("Select an organization first.");
      }

      await clearScanResult(orgId, resultId);
      return resultId;
    },
    onMutate: ({ resultId, kind }) => {
      updateReviewItem(resultId, (entry) => {
        if (entry.kind === "draft" && kind === "draft") {
          return { ...entry, discarding: true, error: null };
        }

        if (entry.kind === "failed" && kind === "failed") {
          return { ...entry, dismissing: true };
        }

        return entry;
      });
    },
    onSuccess: (_resultId, variables) => {
      removeReviewItem(variables.resultId);
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "Failed to discard draft.";
      updateReviewItem(variables.resultId, (entry) => {
        if (entry.kind === "draft" && variables.kind === "draft") {
          return { ...entry, discarding: false, error: message };
        }

        if (entry.kind === "failed" && variables.kind === "failed") {
          return { ...entry, dismissing: false };
        }

        return entry;
      });
    },
  });

  const handlePick = useCallback(async (origin: ScanSourceOrigin) => {
    setPickError(null);
    const result = await pickScanFile(origin);
    if (result.status === "error") {
      setPickError(result.message);
      return;
    }
    if (result.status === "canceled") {
      return;
    }

    if (result.file.fileSize !== null && result.file.fileSize > SCAN_TO_TASK_MAX_FILE_BYTES) {
      setPickError("Files must be 15MB or smaller.");
      return;
    }

    setScanError(null);
    setSelectedFile(result.file);
  }, [setPickError, setScanError, setSelectedFile]);

  const handleScan = useCallback(() => {
    setScanError(null);
    scanMutation.mutate();
  }, [scanMutation, setScanError]);

  const updateDraftField = useCallback((resultId: string, field: keyof DraftForm, value: string) => {
    updateReviewItem(resultId, (item) =>
      item.kind === "draft"
        ? { ...item, form: { ...item.form, [field]: value } }
        : item,
    );
  }, [updateReviewItem]);

  const handleSaveDraft = useCallback(
    (item: DraftReviewItem) => {
      if (!orgId) return;

      const durationMin = toPositiveInt(item.form.durationMin);
      const peopleRequired = toPositiveInt(item.form.peopleRequired);
      const minWaitDays = toNonNegativeInt(item.form.minWaitDays);
      const maxWaitDays = toNonNegativeInt(item.form.maxWaitDays);

      let fieldError: string | null = null;
      if (!item.form.title.trim()) fieldError = "Title is required.";
      else if (durationMin === null) fieldError = "Duration must be a whole number greater than 0.";
      else if (peopleRequired === null) fieldError = "People must be a whole number greater than 0.";
      else if (minWaitDays === null) fieldError = "Min wait days must be a whole number of 0 or more.";
      else if (maxWaitDays === null) fieldError = "Max wait days must be a whole number of 0 or more.";
      else if (maxWaitDays < minWaitDays) fieldError = "Max wait days must be at least min wait days.";

      if (fieldError) {
        updateReviewItem(item.resultId, (entry) =>
          entry.kind === "draft"
            ? {
                ...entry,
                error: fieldError,
              }
            : entry,
        );
        return;
      }

      confirmMutation.mutate({
        item,
        savedTitle: item.form.title.trim(),
        payload: {
          resultId: item.resultId,
          fileName: item.fileName,
          title: item.form.title.trim(),
          description: item.form.description,
          summary: item.form.summary,
          sourceText: item.form.sourceText,
          color: item.form.color,
          durationMin: durationMin!,
          peopleRequired: peopleRequired!,
          minWaitDays: minWaitDays!,
          maxWaitDays: maxWaitDays!,
        },
      });
    },
    [confirmMutation, orgId, updateReviewItem],
  );

  const handleDismiss = useCallback(
    (resultId: string) => {
      clearMutation.mutate({ resultId, kind: "failed" });
    },
    [clearMutation],
  );

  const handleDiscardDraft = useCallback(
    (resultId: string) => {
      clearMutation.mutate({ resultId, kind: "draft" });
    },
    [clearMutation],
  );

  const scanning = stage !== "idle";

  return (
    <Screen scroll keyboardAvoiding contentStyle={styles.content}>
      <ScreenHeader
        kicker="Tool"
        title="Scan to Task"
        subtitle="Turn a photo or PDF into a task draft, then review and save it."
      />

      {!orgId ? (
        <Card padding="lg">
          <Text variant="body" tone="secondary">
            We could not resolve this organization, so Scan to Task is unavailable.
          </Text>
        </Card>
      ) : reviewItems.length > 0 ? (
        <View style={styles.section}>
          {reviewItems.map((item) =>
            item.kind === "draft" ? (
              <DraftReviewCard
                key={item.resultId}
                item={item}
                onChange={(field, value) => updateDraftField(item.resultId, field, value)}
                onSave={() => handleSaveDraft(item)}
                onDiscard={() => handleDiscardDraft(item.resultId)}
              />
            ) : (
              <FailedResultCard key={item.resultId} item={item} onDismiss={() => handleDismiss(item.resultId)} />
            ),
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Card padding="lg">
            {selectedFile ? (
              <SelectedFilePreview
                file={selectedFile}
                disabled={scanning}
                onRemove={() => {
                  setSelectedFile(null);
                  setScanError(null);
                }}
              />
            ) : (
              <SourcePickerRow disabled={scanning} onPick={handlePick} />
            )}
            {pickError ? (
              <Text variant="caption" tone="danger" style={styles.errorText}>
                {pickError}
              </Text>
            ) : null}
          </Card>

          {selectedFile ? (
            <Card padding="lg" style={styles.card}>
              <TextField
                label="Instruction (optional)"
                value={instruction}
                onChangeText={setInstruction}
                placeholder="Turn this into cleanup tasks, extract the action items…"
                multiline
                numberOfLines={3}
                editable={!scanning}
              />
              {scanError ? (
                <Text variant="caption" tone="danger" style={styles.errorText}>
                  {scanError}
                </Text>
              ) : null}
              <Button
                label={stage === "uploading" ? "Uploading…" : stage === "scanning" ? "Scanning…" : "Scan"}
                onPress={handleScan}
                loading={scanning}
                disabled={scanning}
                fullWidth
                style={styles.scanButton}
              />
            </Card>
          ) : null}

          {scanning ? (
            <LoadingState
              compact
              message={stage === "uploading" ? "Uploading file…" : "Scanning file…"}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

type SourcePickerRowProps = {
  disabled: boolean;
  onPick: (origin: ScanSourceOrigin) => void;
};

function SourcePickerRow({ disabled, onPick }: SourcePickerRowProps) {
  return (
    <View>
      <Text variant="bodyStrong">Add a file to scan</Text>
      <Text variant="caption" tone="secondary" style={styles.pickerSubtitle}>
        Take a photo, choose one from your library, or pick a PDF.
      </Text>
      <View style={styles.pickerRow}>
        <Button
          label="Take Photo"
          variant="secondary"
          size="sm"
          disabled={disabled}
          leftIcon={<Camera size={16} color={colors.accent} />}
          onPress={() => onPick("camera")}
          style={styles.pickerButton}
        />
        <Button
          label="Choose Photo"
          variant="secondary"
          size="sm"
          disabled={disabled}
          leftIcon={<ImageIcon size={16} color={colors.accent} />}
          onPress={() => onPick("library")}
          style={styles.pickerButton}
        />
        <Button
          label="Choose PDF"
          variant="secondary"
          size="sm"
          disabled={disabled}
          leftIcon={<FileText size={16} color={colors.accent} />}
          onPress={() => onPick("document")}
          style={styles.pickerButton}
        />
      </View>
    </View>
  );
}

type SelectedFilePreviewProps = {
  file: SelectedFile;
  disabled: boolean;
  onRemove: () => void;
};

function SelectedFilePreview({ file, disabled, onRemove }: SelectedFilePreviewProps) {
  return (
    <View style={styles.previewRow}>
      <View style={styles.previewIconWrap}>
        <FileText size={20} color={colors.accent} />
      </View>
      <View style={styles.previewText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {file.name}
        </Text>
        {file.fileSize !== null ? (
          <Text variant="caption" tone="secondary">
            {formatFileSize(file.fileSize)}
          </Text>
        ) : null}
      </View>
      <Button
        label="Remove"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onPress={onRemove}
        leftIcon={<X size={14} color={colors.textSecondary} />}
      />
    </View>
  );
}

type DraftReviewCardProps = {
  item: Extract<ReviewItem, { kind: "draft" }>;
  onChange: (field: keyof DraftForm, value: string) => void;
  onSave: () => void;
  onDiscard: () => void;
};

function DraftReviewCard({ item, onChange, onSave, onDiscard }: DraftReviewCardProps) {
  const busy = item.saving || item.discarding;
  return (
    <Card padding="lg" style={styles.card}>
      <Text variant="caption" tone="secondary">
        From {item.fileName}
      </Text>
      <TextField
        label="Title"
        value={item.form.title}
        onChangeText={(value) => onChange("title", value)}
        editable={!busy}
        containerStyle={styles.field}
      />
      <TextField
        label="Description"
        value={item.form.description}
        onChangeText={(value) => onChange("description", value)}
        editable={!busy}
        multiline
        numberOfLines={3}
        containerStyle={styles.field}
      />
      <View style={styles.grid}>
        <TextField
          label="Duration (min)"
          value={item.form.durationMin}
          onChangeText={(value) => onChange("durationMin", value)}
          keyboardType="number-pad"
          editable={!busy}
          containerStyle={styles.gridField}
        />
        <TextField
          label="People"
          value={item.form.peopleRequired}
          onChangeText={(value) => onChange("peopleRequired", value)}
          keyboardType="number-pad"
          editable={!busy}
          containerStyle={styles.gridField}
        />
      </View>
      <View style={styles.grid}>
        <TextField
          label="Min wait days"
          value={item.form.minWaitDays}
          onChangeText={(value) => onChange("minWaitDays", value)}
          keyboardType="number-pad"
          editable={!busy}
          containerStyle={styles.gridField}
        />
        <TextField
          label="Max wait days"
          value={item.form.maxWaitDays}
          onChangeText={(value) => onChange("maxWaitDays", value)}
          keyboardType="number-pad"
          editable={!busy}
          containerStyle={styles.gridField}
        />
      </View>
      {item.error ? (
        <Text variant="caption" tone="danger" style={styles.errorText}>
          {item.error}
        </Text>
      ) : null}
      <View style={styles.actionsRow}>
        <Button
          label="Discard"
          variant="outline"
          loading={item.discarding}
          disabled={busy}
          onPress={onDiscard}
          style={styles.actionButton}
        />
        <Button
          label="Save to task list"
          variant="primary"
          loading={item.saving}
          disabled={busy}
          onPress={onSave}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
}

type FailedResultCardProps = {
  item: Extract<ReviewItem, { kind: "failed" }>;
  onDismiss: () => void;
};

function FailedResultCard({ item, onDismiss }: FailedResultCardProps) {
  return (
    <Card padding="lg" style={styles.card}>
      <Text variant="bodyStrong">{item.fileName}</Text>
      <Text variant="caption" tone="danger" style={styles.errorText}>
        {item.message}
      </Text>
      <Button
        label="Dismiss"
        variant="outline"
        size="sm"
        loading={item.dismissing}
        disabled={item.dismissing}
        onPress={onDismiss}
        style={styles.dismissButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  card: {
    marginTop: spacing.lg,
  },
  pickerSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pickerButton: {
    flexGrow: 1,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  previewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    flex: 1,
  },
  scanButton: {
    marginTop: spacing.md,
  },
  errorText: {
    marginTop: spacing.sm,
  },
  field: {
    marginTop: spacing.md,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  gridField: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  dismissButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
});
