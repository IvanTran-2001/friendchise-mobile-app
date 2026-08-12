import { useEffect } from "react";
import { Keyboard } from "react-native";

type UseDismissKeyboardOnIdleOptions = {
  enabled?: boolean;
  ignoreEmpty?: boolean;
};

/**
 * Dismisses the keyboard after a period of inactivity.
 * Keyboard.dismiss is global, so it may blur whichever input is currently focused.
 */
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