"use client";

import { useContext, useMemo } from "react";
import { ToastContext } from "@/components/ui/Toast";

export function useToast() {
  const ctx = useContext(ToastContext);
  return useMemo(
    () => ({
      success: (title: string, description?: string) =>
        ctx?.push({ variant: "success", title, description }),
      error: (title: string, description?: string) =>
        ctx?.push({ variant: "error", title, description }),
      info: (title: string, description?: string) =>
        ctx?.push({ variant: "info", title, description }),
      dismiss: (id: number) => ctx?.dismiss(id),
    }),
    [ctx]
  );
}
