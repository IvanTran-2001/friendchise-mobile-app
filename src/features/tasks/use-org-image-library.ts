import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ExpoImagePicker from "expo-image-picker";
import { deleteOrgImage, getOrgImagesPage, uploadRichTextImage, type OrgImage } from "./task-image-api";

export type PickerSource = "library" | "camera";

type UseOrgImageLibraryOptions = {
  orgId: string;
  search: string;
  enabled: boolean;
};

/**
 * Encapsulates the org image library query, upload, deletion, and
 * cache-invalidation workflow shared by image-picking UI.
 */
export function useOrgImageLibrary({ orgId, search, enabled }: UseOrgImageLibraryOptions) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const imagesQuery = useInfiniteQuery({
    queryKey: ["org-images", orgId, search],
    queryFn: ({ pageParam = 1, signal }) => getOrgImagesPage(orgId, { page: pageParam, pageSize: 24, search, signal }),
    enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const images = useMemo(() => imagesQuery.data?.pages.flatMap((page) => page.images) ?? [], [imagesQuery.data]);
  const loading = imagesQuery.isLoading || imagesQuery.isFetchingNextPage;

  const resetCache = useCallback(() => {
    void queryClient.removeQueries({ queryKey: ["org-images", orgId] });
  }, [orgId, queryClient]);

  const invalidateCache = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["org-images", orgId] });
  }, [orgId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (image: OrgImage) => {
      await deleteOrgImage(orgId, image.id);
      return image;
    },
    onSuccess: async () => {
      await invalidateCache();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to delete image.");
    },
  });

  const resetDeleteMutation = deleteMutation.reset;
  const deleteImageMutation = deleteMutation.mutateAsync;

  const uploadMutation = useMutation({
    mutationFn: async (source: PickerSource) => {
      const result = await pickOrgImage(source);
      if (!result.asset) {
        if (result.errorMessage) {
          setActionError(result.errorMessage);
        }
        return null;
      }

      return uploadRichTextImage(orgId, result.asset);
    },
    onSuccess: async (uploaded) => {
      if (uploaded) {
        await invalidateCache();
      }
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Upload failed.");
    },
  });

  const resetUploadMutation = uploadMutation.reset;
  const uploadImageMutation = uploadMutation.mutateAsync;

  const resetActionError = useCallback(() => {
    setActionError(null);
    resetDeleteMutation();
    resetUploadMutation();
  }, [resetDeleteMutation, resetUploadMutation]);

  /** Deletes an image from the org library, returns whether it succeeded. */
  const deleteImage = useCallback(async (image: OrgImage) => {
    setActionError(null);

    try {
      await deleteImageMutation(image);
      return { ok: true as const };
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete image.";
      setActionError(message);
      return { ok: false as const, error: message };
    }
  }, [deleteImageMutation]);

  /** Picks and uploads a new image, returning the saved image or null on failure/cancel. */
  const uploadImage = useCallback(async (source: PickerSource) => {
    setActionError(null);

    try {
      const uploaded = await uploadImageMutation(source);
      return uploaded;
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setActionError(message);
      return null;
    }
  }, [uploadImageMutation]);

  const uploading = uploadMutation.isPending;
  const deletingId = deleteMutation.isPending ? deleteMutation.variables?.id ?? null : null;
  const actionErrorMessage = actionError ?? deleteMutation.error?.message ?? uploadMutation.error?.message ?? null;

  return {
    images,
    loading,
    queryError: imagesQuery.error,
    refetch: imagesQuery.refetch,
    hasNextPage: imagesQuery.hasNextPage,
    isFetchingNextPage: imagesQuery.isFetchingNextPage,
    fetchNextPage: imagesQuery.fetchNextPage,
    uploading,
    deletingId,
    actionError: actionErrorMessage,
    resetActionError,
    resetCache,
    deleteImage,
    uploadImage,
  };
}

/** Opens the requested image source and returns the picked asset, if any. */
async function pickOrgImage(source: PickerSource): Promise<{ asset: ExpoImagePicker.ImagePickerAsset | null; errorMessage?: string }> {
  const permissions =
    source === "camera"
      ? await ExpoImagePicker.requestCameraPermissionsAsync()
      : await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissions.granted) {
    return {
      asset: null,
      errorMessage: source === "camera" ? "Camera permission is required." : "Media library permission is required.",
    };
  }

  const picker = source === "camera" ? ExpoImagePicker.launchCameraAsync : ExpoImagePicker.launchImageLibraryAsync;
  const result = await picker({
    mediaTypes: ["images"],
    quality: 0.88,
    allowsEditing: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { asset: null };
  }

  return { asset: result.assets[0] };
}
