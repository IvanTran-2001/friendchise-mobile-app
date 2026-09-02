import * as ExpoImagePicker from "expo-image-picker";
import * as ExpoDocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

export type ScanSourceOrigin = "camera" | "library" | "document";

export type PickedScanFile = {
  uri: string;
  name: string;
  mimeType: string;
  fileSize: number | null;
};

export type PickScanFileResult =
  | { status: "picked"; file: PickedScanFile }
  | { status: "canceled" }
  | { status: "error"; message: string };

function inferImageMimeType(uri: string) {
  const cleanUri = uri.split("?")[0]?.split("#")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

async function readFileSize(uri: string): Promise<number | null> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && typeof info.size === "number" ? info.size : null;
}

/**
 * Re-encodes HEIC/HEIF photos to JPEG on-device via the OS image decoder.
 *
 * iPhones default to saving photos as HEIC, and library photos taken with
 * Portrait mode, Live Photos, or Burst can embed many auxiliary images
 * (depth maps, thumbnails, etc). The backend's HEIC decoder (libheif, via
 * `sharp`) enforces a strict cap on those embedded references and rejects
 * such files with a "security limit exceeded" error, so we normalize to
 * JPEG here instead of forwarding the original HEIC container.
 */
async function normalizeImageAsset(uri: string, mimeType: string, name: string) {
  const isHeic = mimeType.toLowerCase() === "image/heic" || mimeType.toLowerCase() === "image/heif";
  if (!isHeic) {
    return { uri, mimeType, name, fileSize: await readFileSize(uri) };
  }

  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const manipulated = await rendered.saveAsync({
    compress: 0.88,
    format: SaveFormat.JPEG,
  });
  const jpegName = name.replace(/\.(heic|heif)$/i, "") + ".jpg";

  return {
    uri: manipulated.uri,
    mimeType: "image/jpeg",
    name: jpegName,
    fileSize: await readFileSize(manipulated.uri),
  };
}

/**
 * Opens the camera, requesting permission first. Returns a friendly message
 * on denial so the caller can show it directly to the user.
 */
async function pickFromCamera(): Promise<PickScanFileResult> {
  const permission = await ExpoImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { status: "error", message: "Camera permission is required to take a photo." };
  }

  const result = await ExpoImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.88,
    allowsEditing: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { status: "canceled" };
  }

  const asset = result.assets[0];
  const normalized = await normalizeImageAsset(
    asset.uri,
    asset.mimeType ?? inferImageMimeType(asset.uri),
    asset.fileName ?? "photo.jpg",
  );

  return { status: "picked", file: normalized };
}

/**
 * Opens the photo library, requesting permission first. Returns a friendly
 * message on denial so the caller can show it directly to the user.
 */
async function pickFromLibrary(): Promise<PickScanFileResult> {
  const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: "error", message: "Photo library permission is required to choose a photo." };
  }

  const result = await ExpoImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.88,
    allowsEditing: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { status: "canceled" };
  }

  const asset = result.assets[0];
  const normalized = await normalizeImageAsset(
    asset.uri,
    asset.mimeType ?? inferImageMimeType(asset.uri),
    asset.fileName ?? "photo.jpg",
  );

  return { status: "picked", file: normalized };
}

/**
 * Opens the system document picker restricted to PDFs. Mobile v1 supports
 * photos (camera/library) and PDFs; other file types the web scanner
 * accepts (docx, txt, csv, etc.) are a documented mobile limitation for now.
 */
async function pickFromDocuments(): Promise<PickScanFileResult> {
  const result = await ExpoDocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { status: "canceled" };
  }

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "application/pdf";
  if (mimeType !== "application/pdf") {
    return { status: "error", message: "Please choose a PDF file." };
  }

  return {
    status: "picked",
    file: {
      uri: asset.uri,
      name: asset.name ?? "document.pdf",
      mimeType,
      fileSize: asset.size ?? null,
    },
  };
}

/** Opens the requested picker source and returns the picked file, if any. */
export async function pickScanFile(origin: ScanSourceOrigin): Promise<PickScanFileResult> {
  try {
    if (origin === "camera") return await pickFromCamera();
    if (origin === "library") return await pickFromLibrary();
    return await pickFromDocuments();
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to open picker. Please try again.",
    };
  }
}
