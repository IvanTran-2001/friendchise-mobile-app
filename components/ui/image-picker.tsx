import { memo, useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { Camera, Check, ImagePlus, Trash2, Upload } from "lucide-react-native";
import { SheetModal } from "./sheet-modal";
import { Text } from "./text";
import { Button } from "./button";
import { SearchField } from "./index";
import { colors, radius, spacing } from "../../src/lib/theme";
import { type OrgImage } from "../../src/features/tasks/task-image-api";
import { useOrgImageLibrary } from "../../src/features/tasks/use-org-image-library";
import { useDebouncedValue } from "../../hooks/use-debounced-value";

type ImagePickerProps = {
  orgId: string;
  value?: SelectedImage | null;
  onChange: (image: SelectedImage | null) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
};

type SelectedImage = {
  storagePath: string;
  signedUrl: string;
  name?: string | null;
};

type Tab = "library" | "upload";

/**
 * Lets the user pick an org-owned image from the library or upload a new one.
 */
export function ImagePicker({ orgId, value, onChange, label = "Image", helperText, disabled }: ImagePickerProps) {
  /** Modal visibility and active tab. */
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("library");

  /** Library search state feeds the infinite query key. */
  const [search, setSearch] = useState("");

  /** Normalized search input used to query and filter the image library. */
  const trimmedSearch = search.trim();
  const debouncedSearch = useDebouncedValue(trimmedSearch, 250);

  const {
    images,
    loading,
    queryError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    uploading,
    deletingId,
    actionError,
    resetActionError,
    resetCache,
    deleteImage,
    uploadImage,
  } = useOrgImageLibrary({ orgId, search: debouncedSearch, enabled: open && tab === "library" });

  /** Clears transient state and cached pages when the picker closes. */
  useEffect(() => {
    if (!open) {
      setSearch("");
      resetActionError();
      resetCache();
    }
  }, [open, resetActionError, resetCache]);

  const selectedPreview = value ?? null;

  const closePicker = useCallback(() => {
    setOpen(false);
  }, []);

  /** Selects the chosen org image and closes the picker. */
  const handleSelect = useCallback((image: OrgImage) => {
    onChange({ storagePath: image.storagePath, signedUrl: image.signedUrl, name: image.name });
    closePicker();
  }, [closePicker, onChange]);

  /** Deletes an image from the org library and clears the selection if needed. */
  const handleDelete = useCallback(async (image: OrgImage) => {
    const result = await deleteImage(image);
    if (result.ok) {
      if (value?.storagePath === image.storagePath) {
        onChange(null);
      }
    } else {
      Alert.alert("Delete failed", result.error);
    }
  }, [deleteImage, onChange, value?.storagePath]);

  /** Uploads a new image from the camera roll or camera capture. */
  const handleUpload = useCallback(async (source: "library" | "camera") => {
    const uploaded = await uploadImage(source);
    if (uploaded) {
      onChange(uploaded);
      closePicker();
    }
  }, [closePicker, onChange, uploadImage]);

  const renderTile = useCallback(
    ({ item }: { item: OrgImage }) => (
      <DeleteableImageTile
        item={item}
        selected={value?.storagePath === item.storagePath}
        deleting={deletingId === item.id}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />
    ),
    [deletingId, handleDelete, handleSelect, value?.storagePath],
  );

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [styles.trigger, pressed && !disabled ? styles.triggerPressed : null, disabled ? styles.triggerDisabled : null]}
      >
        <View style={styles.triggerText}>
          <Text variant="label" tone="secondary">{label}</Text>
          <Text variant="bodyStrong" numberOfLines={1}>
            {getSelectedImageLabel(selectedPreview)}
          </Text>
          {helperText ? <Text variant="caption" tone="secondary">{helperText}</Text> : null}
        </View>
        {selectedPreview ? (
          <Image source={{ uri: selectedPreview.signedUrl }} style={styles.previewThumb} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <ImagePlus size={18} strokeWidth={2.3} color={colors.textTertiary} />
          </View>
        )}
      </Pressable>

      <SheetModal visible={open} onClose={closePicker} title={label} subtitle="Choose a library image or upload one">
        <View style={styles.tabsRow}>
          <TabButton active={tab === "library"} label="Library" onPress={() => setTab("library")} />
          <TabButton active={tab === "upload"} label="Upload" onPress={() => setTab("upload")} />
        </View>

        {tab === "upload" ? (
          <View style={styles.uploadPane}>
            <Button label={uploading ? "Uploading…" : "Choose file"} onPress={() => void handleUpload("library")} loading={uploading} leftIcon={<Upload size={16} color={colors.textInverse} />} />
            <Button label={uploading ? "Uploading…" : "Take photo"} variant="outline" onPress={() => void handleUpload("camera")} disabled={uploading} leftIcon={<Camera size={16} color={colors.textPrimary} />} />
            {actionError ? <Text variant="caption" tone="danger" align="center">{actionError}</Text> : null}
          </View>
        ) : (
          <View style={styles.libraryPane}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search images…" />
            {actionError ? <Text variant="caption" tone="danger" align="center">{actionError}</Text> : null}
            <FlatList
              data={images}
              numColumns={3}
              keyExtractor={(item) => item.id}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.grid}
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (!loading && hasNextPage && !isFetchingNextPage) {
                  void fetchNextPage();
                }
              }}
              ListEmptyComponent={
                loading ? (
                  <Text variant="caption" tone="secondary" align="center">Loading images…</Text>
                ) : queryError ? (
                  <View style={styles.emptyState}>
                    <ImagePlus size={24} strokeWidth={2.2} color={colors.textTertiary} />
                    <Text variant="caption" tone="danger" align="center">
                      {queryError instanceof Error ? queryError.message : "Failed to load images."}
                    </Text>
                    <Button label="Retry" variant="outline" onPress={() => void refetch()} />
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <ImagePlus size={24} strokeWidth={2.2} color={colors.textTertiary} />
                    <Text variant="caption" tone="secondary" align="center">
                      {trimmedSearch ? "No images match your search." : "No images in this org yet."}
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={
                images.length > 0 && queryError ? (
                  <View style={styles.emptyState}>
                    <Text variant="caption" tone="danger" align="center">
                      {queryError instanceof Error ? queryError.message : "Failed to load images."}
                    </Text>
                    <Button label="Retry" variant="outline" onPress={() => void refetch()} />
                  </View>
                ) : null
              }
              renderItem={renderTile}
            />
          </View>
        )}
      </SheetModal>
    </>
  );
}

/**
 * Renders one of the picker tabs with active-state styling.
 */
function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, active ? styles.tabActive : null, pressed ? styles.tabPressed : null]}
    >
      <Text variant="bodyStrong" style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Returns a human-friendly label for the selected image preview.
 */
function getSelectedImageLabel(image: SelectedImage | null) {
  if (!image) {
    return "Choose from library or upload";
  }

  return image.name ?? image.storagePath.split("/").pop() ?? "Selected image";
}

/**
 * Renders a normal image tile or a placeholder while deletion is in progress.
 */
const DeleteableImageTile = memo(function DeleteableImageTile({
  item,
  selected,
  deleting,
  onSelect,
  onDelete,
}: {
  item: OrgImage;
  selected: boolean;
  deleting: boolean;
  onSelect: (image: OrgImage) => void;
  onDelete: (image: OrgImage) => void;
}) {
  const label = item.name ?? item.storagePath.split("/").pop() ?? "image";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Select ${label}`}
      onPress={() => onSelect(item)}
      disabled={deleting}
      style={({ pressed }) => [styles.imageTile, pressed ? styles.imageTilePressed : null, deleting ? styles.imageTileDeleting : null]}
    >
      {deleting ? (
        <View style={styles.deleteSkeleton}>
          <View style={styles.deleteSkeletonImage} />
          <View style={styles.deleteSkeletonFooter}>
            <View style={styles.deleteSkeletonBadge} />
            <View style={styles.deleteSkeletonLine} />
          </View>
        </View>
      ) : (
        <>
          <Image source={{ uri: item.signedUrl }} style={styles.image} />
          {selected ? (
            <View style={styles.imageOverlay}>
              <Check size={14} color={colors.textInverse} strokeWidth={2.6} />
            </View>
          ) : null}
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              Alert.alert(
                "Delete image?",
                "This will remove the image from the org library.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => onDelete(item) },
                ],
              );
            }}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name ?? "image"}`}
            style={({ pressed }) => [styles.deleteButton, pressed ? styles.deleteButtonPressed : null]}
          >
            <Trash2 size={13} color={colors.textInverse} strokeWidth={2.4} />
          </Pressable>
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  trigger: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  triggerPressed: {
    opacity: 0.88,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerText: {
    flex: 1,
    gap: 2,
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  previewPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoftBorder,
  },
  tabPressed: {
    opacity: 0.88,
  },
  tabLabel: {
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.accent,
  },
  uploadPane: {
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  libraryPane: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  gridRow: {
    gap: spacing.sm,
  },
  imageTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  imageTilePressed: {
    opacity: 0.85,
  },
  imageTileDeleting: {
    opacity: 1,
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  deleteSkeleton: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  deleteSkeletonImage: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: "rgba(148, 163, 184, 0.20)",
  },
  deleteSkeletonFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  deleteSkeletonBadge: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.22)",
  },
  deleteSkeletonLine: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.22)",
  },
  imageOverlay: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  deleteButton: {
    position: "absolute",
    left: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.82)",
  },
  deleteButtonPressed: {
    opacity: 0.82,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
});