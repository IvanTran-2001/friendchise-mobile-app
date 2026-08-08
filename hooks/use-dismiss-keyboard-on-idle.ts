import { useEffect } from "react";
import { Keyboard } from "react-native";

type UseDismissKeyboardOnIdleOptions = {
  enabled?: boolean;
  ignoreEmpty?: boolean;
};

export function useDismissKeyboardOnIdle(
  value: string,
  delayMs: number,
  { enabled = true, ignoreEmpty = true }: UseDismissKeyboardOnIdleOptions = {},
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (ignoreEmpty && !value.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      Keyboard.dismiss();
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [delayMs, enabled, ignoreEmpty, value]);
}