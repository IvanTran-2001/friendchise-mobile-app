import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SheetModal } from "../ui/sheet-modal";
import { colors, radius, spacing } from "../../src/lib/theme";

type GlobalSheetOptions = {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  headerRight?: ReactNode;
};

type GlobalSheetState = {
  visible: boolean;
  content: ReactNode | null;
  title?: string;
  subtitle?: string;
  loading: boolean;
  headerRight?: ReactNode;
};

type GlobalSheetContextValue = {
  openSheet: (content: ReactNode | null, options?: GlobalSheetOptions) => void;
  updateSheet: (content: ReactNode | null, options?: GlobalSheetOptions) => void;
  closeSheet: () => void;
};

const GlobalSheetContext = createContext<GlobalSheetContextValue | null>(null);

const initialState: GlobalSheetState = {
  visible: false,
  content: null,
  title: undefined,
  subtitle: undefined,
  loading: false,
  headerRight: undefined,
};

export function GlobalSheetProvider({ children }: { children: ReactNode }) {
  const [sheetState, setSheetState] = useState<GlobalSheetState>(initialState);

  const openSheet = useCallback((content: ReactNode | null, options?: GlobalSheetOptions) => {
    setSheetState({
      visible: true,
      content,
      title: options?.title,
      subtitle: options?.subtitle,
      loading: options?.loading ?? false,
      headerRight: options?.headerRight,
    });
  }, []);

  const updateSheet = useCallback((content: ReactNode | null, options?: GlobalSheetOptions) => {
    setSheetState((current) => ({
      ...current,
      content,
      title: options?.title ?? current.title,
      subtitle: options?.subtitle ?? current.subtitle,
      loading: options?.loading ?? current.loading,
      headerRight: options?.headerRight === undefined ? current.headerRight : options.headerRight,
    }));
  }, []);

  const closeSheet = useCallback(() => {
    setSheetState((current) => ({ ...current, visible: false }));
  }, []);

  const handleDismiss = useCallback(() => {
    setSheetState(initialState);
  }, []);

  const value = useMemo(
    () => ({ openSheet, updateSheet, closeSheet }),
    [closeSheet, openSheet, updateSheet],
  );

  return (
    <GlobalSheetContext.Provider value={value}>
      {children}
      <SheetModal
        visible={sheetState.visible}
        onClose={closeSheet}
        onCloseComplete={handleDismiss}
        title={sheetState.title}
        subtitle={sheetState.subtitle}
        headerRight={sheetState.headerRight}
      >
        {sheetState.loading ? <GlobalSheetSkeleton /> : sheetState.content}
      </SheetModal>
    </GlobalSheetContext.Provider>
  );
}

/**
 * Returns the global sheet controller for the current app shell.
 *
 * Use this hook to open, update, or close the shared sheet from any screen or
 * nested component rendered inside the provider.
 */
export function useGlobalSheet() {
  const context = useContext(GlobalSheetContext);
  if (!context) {
    throw new Error("useGlobalSheet must be used within a GlobalSheetProvider.");
  }

  return context;
}

/**
 * Lightweight placeholder content shown while a global sheet is loading.
 *
 * The structure mirrors the profile/settings layout so the shell feels stable
 * while async data or lazy content is being prepared.
 */
function GlobalSheetSkeleton() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.hero}>
        <View style={styles.avatar} />
        <View style={styles.title} />
        <View style={styles.badge} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionLabel} />
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon} />
            <View style={styles.cardTextWrap}>
              <View style={styles.cardLine} />
              <View style={styles.cardLineShort} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionLabel} />
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon} />
            <View style={styles.cardTextWrap}>
              <View style={styles.cardLine} />
              <View style={styles.cardLineShort} />
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon} />
            <View style={styles.cardTextWrap}>
              <View style={styles.cardLine} />
              <View style={styles.cardLineShort} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    gap: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    width: 132,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  badge: {
    width: 96,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    width: 84,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  cardTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  cardLine: {
    width: "68%",
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  cardLineShort: {
    width: "42%",
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
});