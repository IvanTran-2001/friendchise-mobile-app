import { create } from "zustand";

export type SelectedFile = {
  uri: string;
  name: string;
  mimeType: string;
  fileSize: number | null;
};

export type DraftForm = {
  title: string;
  description: string;
  summary: string;
  sourceText: string;
  color?: string;
  durationMin: string;
  peopleRequired: string;
  minWaitDays: string;
  maxWaitDays: string;
};

export type ScanWorkflowStage = "idle" | "uploading" | "scanning";

export type DraftReviewItem = {
  kind: "draft";
  resultId: string;
  fileName: string;
  form: DraftForm;
  saving: boolean;
  discarding: boolean;
  error: string | null;
};

export type FailedReviewItem = {
  kind: "failed";
  resultId: string;
  fileName: string;
  message: string;
  dismissing: boolean;
};

export type ReviewItem = DraftReviewItem | FailedReviewItem;

type ScanToTaskWorkflowState = {
  selectedFile: SelectedFile | null;
  instruction: string;
  pickError: string | null;
  scanError: string | null;
  reviewItems: ReviewItem[];
  stage: ScanWorkflowStage;
  setSelectedFile: (file: SelectedFile | null) => void;
  setInstruction: (instruction: string) => void;
  setPickError: (message: string | null) => void;
  setScanError: (message: string | null) => void;
  setReviewItems: (items: ReviewItem[]) => void;
  setStage: (stage: ScanWorkflowStage) => void;
  resetWorkflow: () => void;
  updateReviewItem: (resultId: string, updater: (item: ReviewItem) => ReviewItem) => void;
  removeReviewItem: (resultId: string) => void;
};

const initialState = {
  selectedFile: null,
  instruction: "",
  pickError: null,
  scanError: null,
  reviewItems: [],
  stage: "idle" as ScanWorkflowStage,
};

export const useScanToTaskWorkflowStore = create<ScanToTaskWorkflowState>()((set) => ({
  ...initialState,
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setInstruction: (instruction) => set({ instruction }),
  setPickError: (pickError) => set({ pickError }),
  setScanError: (scanError) => set({ scanError }),
  setReviewItems: (reviewItems) => set({ reviewItems }),
  setStage: (stage) => set({ stage }),
  resetWorkflow: () => set(initialState),
  updateReviewItem: (resultId, updater) =>
    set((state) => ({
      reviewItems: state.reviewItems.map((item) => (item.resultId === resultId ? updater(item) : item)),
    })),
  removeReviewItem: (resultId) =>
    set((state) => ({
      reviewItems: state.reviewItems.filter((item) => item.resultId !== resultId),
    })),
}));
