import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuthenticated: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasHydrated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "friendchise.auth.state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          state?.setAuthenticated(false);
          state?.setHasHydrated(true);
          return;
        }

        state?.setHasHydrated(true);
      },
    },
  ),
);