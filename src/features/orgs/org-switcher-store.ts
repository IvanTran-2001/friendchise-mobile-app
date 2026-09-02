import { create } from "zustand";

type OrgSwitcherState = {
  selectedOrgId: string | null;
  setSelectedOrgId: (orgId: string | null) => void;
  clearSelectedOrgId: () => void;
};

export const useOrgSwitcherStore = create<OrgSwitcherState>((set) => ({
  selectedOrgId: null,
  setSelectedOrgId: (orgId) => set({ selectedOrgId: orgId }),
  clearSelectedOrgId: () => set({ selectedOrgId: null }),
}));