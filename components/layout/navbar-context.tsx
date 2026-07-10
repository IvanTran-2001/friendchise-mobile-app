import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type NavbarActionsContent = ReactNode | (() => ReactNode);

type NavbarContextValue = {
  actions: NavbarActionsContent | null;
  setActions: (actions: NavbarActionsContent | null) => void;
};

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<NavbarActionsContent | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);

  return (
    <NavbarContext.Provider value={value}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbarActions() {
  return useContext(NavbarContext)?.actions ?? null;
}

export function useNavbarSetters() {
  const context = useContext(NavbarContext);

  return {
    setActions: context?.setActions,
  };
}

export function useRegisterNavbarActions(actions: NavbarActionsContent | null) {
  const context = useContext(NavbarContext);
  const setActions = context?.setActions;

  useEffect(() => {
    if (!setActions) return;

    setActions(actions);
  }, [actions, setActions]);

  useEffect(() => {
    if (!setActions) return;

    return () => {
      setActions(null);
    };
  }, [setActions]);
}