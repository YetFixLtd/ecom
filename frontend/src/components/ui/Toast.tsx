"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => number;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { ...t, id }]);
      const ttl = t.variant === "error" ? 6000 : 3500;
      window.setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
              {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const styles = variantStyles[toast.variant];
  const Icon = styles.icon;
  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles.wrap}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.iconColor}`} />
      <div className="flex-1">
        <div className="font-medium">{toast.title}</div>
        {toast.description ? (
          <div className="mt-0.5 text-xs opacity-80">{toast.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const variantStyles: Record<
  ToastVariant,
  { wrap: string; icon: typeof Info; iconColor: string }
> = {
  success: {
    wrap: "bg-white border-emerald-200 text-emerald-900",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  error: {
    wrap: "bg-white border-red-200 text-red-900",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  info: {
    wrap: "bg-white border-blue-200 text-blue-900",
    icon: Info,
    iconColor: "text-blue-600",
  },
};
