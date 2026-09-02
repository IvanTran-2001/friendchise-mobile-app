import { authenticatedFetch } from "../../../lib/api/authenticated-fetch";

/**
 * Max upload size, mirroring `MAX_FILE_BYTES` in the web app's
 * `lib/services/scan-to-task.ts`. Checked client-side before upload so users
 * get an immediate, friendly error instead of waiting on a network round trip.
 */
export const SCAN_TO_TASK_MAX_FILE_BYTES = 15 * 1024 * 1024;

export type ScanTaskDraft = {
  title: string;
  description: string;
  summary: string;
  sourceText: string;
  color?: string;
  durationMin: number;
  peopleRequired: number;
  minWaitDays: number;
  maxWaitDays: number;
};

export type ScanResultItem =
  | {
      ok: true;
      resultId: string;
      fileName: string;
      fileKind: string;
      fileSize: number;
      draft: ScanTaskDraft;
    }
  | {
      ok: false;
      resultId: string;
      fileName: string;
      fileKind: string;
      fileSize: number;
      error: string;
    };

export type ScanSource = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

type SignedUploadResponse = {
  signedUrl: string;
  path: string;
};

function isSignedUpload(value: unknown): value is SignedUploadResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { signedUrl?: unknown }).signedUrl === "string" &&
    typeof (value as { path?: unknown }).path === "string"
  );
}

function isScanTaskDraft(value: unknown): value is ScanTaskDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.title === "string" &&
    typeof draft.description === "string" &&
    typeof draft.summary === "string" &&
    typeof draft.sourceText === "string" &&
    (draft.color === undefined || typeof draft.color === "string") &&
    typeof draft.durationMin === "number" &&
    typeof draft.peopleRequired === "number" &&
    typeof draft.minWaitDays === "number" &&
    typeof draft.maxWaitDays === "number"
  );
}

function isScanResultItem(value: unknown): value is ScanResultItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (
    typeof item.resultId !== "string" ||
    typeof item.fileName !== "string" ||
    typeof item.fileKind !== "string" ||
    typeof item.fileSize !== "number"
  ) {
    return false;
  }

  if (item.ok === true) return isScanTaskDraft(item.draft);
  if (item.ok === false) return typeof item.error === "string";
  return false;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  const message = payload && typeof payload === "object" && "error" in payload ? (payload as { error?: unknown }).error : null;
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function withTimeoutMessage<T>(promise: Promise<T>, message: string) {
  try {
    return await promise;
  } catch (error) {
    // React Native's fetch may reject with a plain Error rather than a DOMException.
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(message);
    }

    throw error;
  }
}

/**
 * Requests a signed upload URL, then uploads the given local file to storage
 * and returns the source descriptor the scan endpoint expects. Cleans up
 * nothing on failure since the temp file is deleted server-side by the scan
 * pipeline (or never referenced if the upload itself failed).
 */
export async function uploadScanSource(
  orgId: string,
  file: { uri: string; name: string; mimeType: string; fileSize: number | null },
): Promise<ScanSource> {
  if (file.fileSize === null) {
    throw new Error("Could not determine file size.");
  }
  if (file.fileSize > SCAN_TO_TASK_MAX_FILE_BYTES) {
    throw new Error("Files must be 15MB or smaller.");
  }

  const encodedOrgId = encodeURIComponent(orgId);

  const uploadUrlResponse = await authenticatedFetch(`/api/orgs/${encodedOrgId}/tools/scan-to-task/upload-url`, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, mimeType: file.mimeType }),
  });

  const uploadUrlPayload: unknown = await uploadUrlResponse.json().catch(() => null);
  if (!uploadUrlResponse.ok || !isSignedUpload(uploadUrlPayload)) {
    throw new Error(extractErrorMessage(uploadUrlPayload, "Failed to prepare upload."));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const assetResponse = await withTimeoutMessage(
      fetch(file.uri, { signal: controller.signal }),
      "Upload timed out. Please try again.",
    );
    if (!assetResponse.ok) {
      throw new Error("Failed to read the selected file.");
    }

    const blob = await assetResponse.blob();
    if (!blob.size) {
      throw new Error("Selected file is empty.");
    }

    const putResponse = await withTimeoutMessage(
      fetch(uploadUrlPayload.signedUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": file.mimeType },
        signal: controller.signal,
      }),
      "Upload timed out. Please try again.",
    );

    if (!putResponse.ok) {
      throw new Error("Upload failed. Please try again.");
    }

    return {
      storagePath: uploadUrlPayload.path,
      fileName: file.name,
      mimeType: file.mimeType,
      fileSize: blob.size,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Runs the Scan to Task pipeline against previously uploaded sources and
 * returns one result (draft or error) per generated task.
 */
export async function runScanToTask(orgId: string, sources: ScanSource[], instruction: string): Promise<ScanResultItem[]> {
  const encodedOrgId = encodeURIComponent(orgId);
  const response = await authenticatedFetch(`/api/orgs/${encodedOrgId}/tools/scan-to-task`, {
    method: "POST",
    body: JSON.stringify({ sources, instruction }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to scan file."));
  }

  const results = payload && typeof payload === "object" ? (payload as { results?: unknown }).results : null;
  if (!Array.isArray(results) || !results.every(isScanResultItem)) {
    throw new Error("Unexpected response while scanning file.");
  }

  return results;
}

export type ConfirmScanDraftInput = {
  resultId: string;
  fileName: string;
  title: string;
  description: string;
  summary: string;
  sourceText: string;
  color?: string;
  durationMin: number;
  peopleRequired: number;
  minWaitDays: number;
  maxWaitDays: number;
};

/** Confirms one reviewed draft, creating the real task and returning its id. */
export async function confirmScanDraft(orgId: string, input: ConfirmScanDraftInput): Promise<string | null> {
  const encodedOrgId = encodeURIComponent(orgId);
  const response = await authenticatedFetch(`/api/orgs/${encodedOrgId}/tools/scan-to-task/confirm`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to save task."));
  }

  const taskId = payload && typeof payload === "object" ? (payload as { taskId?: unknown }).taskId : null;
  return typeof taskId === "string" ? taskId : null;
}

/** Discards a reviewed draft without creating a task. */
export async function clearScanResult(orgId: string, resultId: string): Promise<void> {
  const encodedOrgId = encodeURIComponent(orgId);
  const response = await authenticatedFetch(`/api/orgs/${encodedOrgId}/tools/scan-to-task/clear`, {
    method: "POST",
    body: JSON.stringify({ resultId }),
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(payload, "Failed to discard draft."));
  }
}
