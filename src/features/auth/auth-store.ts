import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
    }),
    {
      name: "friendchise.auth.state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
);