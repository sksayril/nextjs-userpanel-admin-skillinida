import { useCallback, useEffect, useRef, useState } from "react";
import { executePrint } from "@/lib/printDocument";

export type PrintDocumentType =
  | "marksheet"
  | "certificate"
  | "cumulative_marksheet"
  | "admitcard"
  | "idcard";

export interface PrintTarget {
  type: PrintDocumentType;
  data: any;
}

export function usePrintTrigger() {
  const [printTarget, setPrintTargetState] = useState<PrintTarget | null>(null);
  const pendingPrintRef = useRef(false);

  const triggerPrint = useCallback((type: PrintDocumentType, data: any) => {
    pendingPrintRef.current = true;
    setPrintTargetState({ type, data });
  }, []);

  useEffect(() => {
    if (!printTarget || !pendingPrintRef.current) return;

    pendingPrintRef.current = false;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        executePrint();
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [printTarget]);

  return { printTarget, triggerPrint, setPrintTarget: setPrintTargetState };
}
