import { authenticatedFetch } from "../../lib/api/authenticated-fetch";

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

async function extractErrorMessage(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null);
  const message = payload && typeof payload === "object" && "error" in payload ? (payload as { error?: unknown }).error : null;
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function withTimeoutMessage<T>(promise: Promise<T>, message: string) {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
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
  file: { uri: string; name: string; mimeType: string },
): Promise<ScanSource> {
  const encodedOrgId = encodeURIComponent(orgId);

  const uploadUrlResponse = await authenticatedFetch(`/api/orgs/${encodedOrgId}/tools/scan-to-task/upload-url`, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, mimeType: file.mimeType }),
  });

  const uploadUrlPayload: unknown = await uploadUrlResponse.json().catch(() => null);
  if (!uploadUrlResponse.ok || !isSignedUpload(uploadUrlPayload)) {
    throw new Error(await extractErrorMessage(uploadUrlResponse, "Failed to prepare upload."));
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
    if (blob.size > SCAN_TO_TASK_MAX_FILE_BYTES) {
      throw new Error("Files must be 15MB or smaller.");
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
    throw new Error(await extractErrorMessage(response, "Failed to scan file."));
  }

  const results = payload && typeof payload === "object" ? (payload as { results?: unknown }).results : null;
  if (!Array.isArray(results)) {
    throw new Error("Unexpected response while scanning file.");
  }

  return results as ScanResultItem[];
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
    throw new Error(await extractErrorMessage(response, "Failed to save task."));
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
    throw new Error(await extractErrorMessage(response, "Failed to discard draft."));
  }
}
