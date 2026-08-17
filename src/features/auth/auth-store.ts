import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  isAuthenticated: boolean;
  hasHydrated: boolean;
  /** Whether the current session belongs to a demo account. Persisted alongside `demoExpiresAt`. */
  isDemo: boolean;
  /** Epoch ms when the current demo session expires, or null if not a demo session. Persisted alongside `isDemo`. */
  demoExpiresAt: number | null;
  setAuthenticated: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  setDemoSession: (session: { isDemo: boolean; expiresAt: number | null }) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasHydrated: false,
      isDemo: false,
      demoExpiresAt: null,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setDemoSession: ({ isDemo, expiresAt }) => set({ isDemo, demoExpiresAt: expiresAt }),
    }),
    {
      name: "friendchise.auth.state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isDemo: state.isDemo,
        demoExpiresAt: state.demoExpiresAt,
      }),
      onRehydrateStorage: () => (_state, error) => {
        const { setAuthenticated, setHasHydrated } = useAuthStore.getState();

        if (error) {
          setAuthenticated(false);
          setHasHydrated(true);
          return;
        }

        setHasHydrated(true);
      },
    },
  ),
);