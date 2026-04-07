import { useCallback, useState } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title?: string;
  message: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: Toast["type"], message: string, title?: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    },
    []
  );

  const success = useCallback(
    (message: string, title?: string) => toast("success", message, title),
    [toast]
  );

  const error = useCallback(
    (message: string, title?: string) => toast("error", message, title),
    [toast]
  );

  const info = useCallback(
    (message: string, title?: string) => toast("info", message, title),
    [toast]
  );

  return { toasts, dismiss, success, error, info };
}