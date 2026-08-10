import * as ImagePicker from "expo-image-picker";
import { authenticatedFetch } from "../../lib/api/authenticated-fetch";

export type OrgImage = {
  id: string;
  storagePath: string;
  name: string | null;
  signedUrl: string;
};

export type OrgImagePage = {
  images: OrgImage[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

type GetOrgImagesPageOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  signal?: AbortSignal;
};

function isValidOrgImage(value: unknown): value is OrgImage {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string" &&
    (value as { id: string }).id.trim().length > 0 &&
    typeof (value as { storagePath?: unknown }).storagePath === "string" &&
    (value as { storagePath: string }).storagePath.trim().length > 0 &&
    typeof (value as { signedUrl?: unknown }).signedUrl === "string" &&
    (value as { signedUrl: string }).signedUrl.trim().length > 0
  );
}

/**
 * Loads a paginated slice of org images with signed read URLs.
 */
export async function getOrgImagesPage(orgId: string, options: GetOrgImagesPageOptions = {}) {
  const encodedOrgId = encodeURIComponent(orgId);
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  if (options.search?.trim()) params.set("search", options.search.trim());

  const response = await authenticatedFetch(`/api/orgs/${encodedOrgId}/images?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  });
  const payload = (await response.json().catch(() => null)) as OrgImagePage | { error?: string } | null;

  const isValidPage =
    payload !== null &&
    typeof payload === "object" &&
    Array.isArray((payload as OrgImagePage).images) &&
    (payload as OrgImagePage).images.every(isValidOrgImage) &&
    typeof (payload as OrgImagePage).totalCount === "number" &&
    typeof (payload as OrgImagePage).totalPages === "number" &&
    typeof (payload as OrgImagePage).page === "number" &&
    typeof (payload as OrgImagePage).pageSize === "number";

  if (!response.ok || !isValidPage) {
    const message = payload && typeof payload === "object" && "error" in payload ? payload.error : null;
    throw new Error(typeof message === "string" ? message : "Failed to load images.");
  }

  return payload as OrgImagePage;
}

type SignedUploadResponse = {
  signedUrl: string;
  path: string;
};

type SaveImageResponse = {
  image: {
    storagePath: string;
    signedUrl: string;
  };
};

/**
 * Uploads a picked image to the org library and returns the saved image row.
 */
export async function uploadRichTextImage(orgId: string, asset: ImagePicker.ImagePickerAsset) {
  const encodedOrgId = encodeURIComponent(orgId);
  const mimeType = asset.mimeType ?? inferMimeTypeFromUri(asset.uri) ?? "image/jpeg";
  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const uploadResponse = await authenticatedFetch(`/api/orgs/${encodedOrgId}/images/upload-url`, {
      method: "POST",
      body: JSON.stringify({ mimeType }),
    });

    const uploadPayload = (await uploadResponse.json().catch(() => null)) as SignedUploadResponse | { error?: string } | null;
    const uploadData = uploadPayload && typeof uploadPayload === "object" ? uploadPayload : null;
    const signedUrl = uploadData && typeof (uploadData as { signedUrl?: unknown }).signedUrl === "string"
      ? (uploadData as { signedUrl: string }).signedUrl
      : null;
    const path = uploadData && typeof (uploadData as { path?: unknown }).path === "string"
      ? (uploadData as { path: string }).path
      : null;

    if (
      !uploadResponse.ok ||
      typeof signedUrl !== "string" ||
      !signedUrl.trim() ||
      typeof path !== "string" ||
      !path.trim()
    ) {
      const message = uploadPayload && typeof uploadPayload === "object" && "error" in uploadPayload ? uploadPayload.error : null;
      throw new Error(typeof message === "string" ? message : "Failed to prepare image upload.");
    }

    controller = new AbortController();
    timeoutId = setTimeout(() => controller?.abort(), 30000);

    const assetResponse = await fetch(asset.uri, { signal: controller.signal });
    if (!assetResponse.ok) {
      throw new Error("Failed to read the selected image.");
    }

    const blob = await assetResponse.blob();
    if (!blob.size) {
      throw new Error("Selected image is empty.");
    }

    const putResponse = await fetch(signedUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": mimeType },
      signal: controller.signal,
    });

    if (!putResponse.ok) {
      throw new Error("Upload failed. Please try again.");
    }

    const saveResponse = await authenticatedFetch(`/api/orgs/${encodedOrgId}/images`, {
      method: "POST",
      body: JSON.stringify({
        storagePath: path,
        name: asset.fileName ?? "image",
      }),
    });

    const savePayload = (await saveResponse.json().catch(() => null)) as SaveImageResponse | { error?: string } | null;
    const savedImage =
      savePayload &&
      typeof savePayload === "object" &&
      "image" in savePayload &&
      savePayload.image &&
      typeof savePayload.image === "object" &&
      typeof (savePayload.image as { storagePath?: unknown }).storagePath === "string" &&
      (savePayload.image as { storagePath: string }).storagePath.trim() &&
      typeof (savePayload.image as { signedUrl?: unknown }).signedUrl === "string" &&
      (savePayload.image as { signedUrl: string }).signedUrl.trim()
        ? (savePayload.image as SaveImageResponse["image"])
        : null;

    if (!saveResponse.ok || !savedImage) {
      const message = savePayload && typeof savePayload === "object" && "error" in savePayload ? savePayload.error : null;
      throw new Error(typeof message === "string" ? message : "Failed to save image.");
    }

    return savedImage;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function inferMimeTypeFromUri(uri: string) {
  const cleanUri = uri.split("?")[0]?.split("#")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return null;
  }
}

/**
 * Deletes an org image from the library.
 */
export async function deleteOrgImage(orgId: string, imageId: string) {
  const encodedOrgId = encodeURIComponent(orgId);
  const encodedImageId = encodeURIComponent(imageId);
  const response = await authenticatedFetch(`/api/orgs/${encodedOrgId}/images/${encodedImageId}`, {
    method: "DELETE",
  });

  const payload = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
  if (!response.ok) {
    const message = payload && typeof payload.error === "string" ? payload.error : "Failed to delete image.";
    throw new Error(message);
  }
}

/**
 * Resolves an org-owned storage path into a signed read URL.
 */
export async function getRichTextImageReadUrl(orgId: string, storagePath: string) {
  const encodedOrgId = encodeURIComponent(orgId);
  const response = await authenticatedFetch(`/api/orgs/${encodedOrgId}/storage/read-url`, {
    method: "POST",
    body: JSON.stringify({ storagePath }),
  });

  const payload = (await response.json().catch(() => null)) as ReadUrlResponse | { error?: string } | null;
  const signedUrl = payload && typeof payload === "object" && "signedUrl" in payload ? payload.signedUrl : null;
  if (!response.ok || typeof signedUrl !== "string" || !signedUrl.trim()) {
    return null;
  }

  return signedUrl;
}

type ReadUrlResponse = {
  signedUrl: string;
};