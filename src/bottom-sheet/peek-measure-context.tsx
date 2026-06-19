import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type PeekMeasureContextValue = (node: HTMLElement | null) => void;

const PeekMeasureContext = createContext<PeekMeasureContextValue | null>(null);

export function PeekMeasureProvider({
  onPeekMeasure,
  children,
}: {
  onPeekMeasure: PeekMeasureContextValue;
  children: ReactNode;
}) {
  return (
    <PeekMeasureContext.Provider value={onPeekMeasure}>
      {children}
    </PeekMeasureContext.Provider>
  );
}

export function usePeekMeasureRef(): PeekMeasureContextValue {
  const value = useContext(PeekMeasureContext);
  if (!value) {
    throw new Error("usePeekMeasureRef must be used within BottomSheet");
  }
  return value;
}
