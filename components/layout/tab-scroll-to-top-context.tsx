import { createContext, useContext, useEffect, useState } from "react";

type ScrollToTopHandler = (() => void) | null;

type TabScrollToTopContextValue = {
  setScrollToTopHandler: (handler: ScrollToTopHandler) => void;
  scrollToTop: () => void;
};

const TabScrollToTopContext = createContext<TabScrollToTopContextValue | null>(null);

export function TabScrollToTopProvider({ children }: { children: React.ReactNode }) {
  const [handler, setHandler] = useState<ScrollToTopHandler>(null);

  return (
    <TabScrollToTopContext.Provider
      value={{
        setScrollToTopHandler: setHandler,
        scrollToTop: () => {
          handler?.();
        },
      }}
    >
      {children}
    </TabScrollToTopContext.Provider>
  );
}

export function useRegisterTabScrollToTop(handler: ScrollToTopHandler) {
  const context = useContext(TabScrollToTopContext);

  useEffect(() => {
    if (!context) return;

    context.setScrollToTopHandler(handler);
    return () => {
      context.setScrollToTopHandler(null);
    };
  }, [context, handler]);
}

export function useTabScrollToTop() {
  const context = useContext(TabScrollToTopContext);

  if (!context) {
    return () => {};
  }

  return context.scrollToTop;
}