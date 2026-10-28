"use client";

import { CheckCircle2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: number;
  message: string;
};

type ActionFeedback = {
  error?: string;
  notice?: string;
};

type ToastContextValue = (message: string) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string) => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, message }]);
    timers.current.set(
      id,
      window.setTimeout(() => {
        timers.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4500),
    );
  }, []);

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) {
        window.clearTimeout(timer);
      }
      timers.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        aria-label="Notifications"
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))]"
      >
        {toasts.map(({ id, message }) => (
          <div
            className="app-toast flex w-full items-start gap-3 rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-4 py-3 text-sm text-[#19251e] shadow-[0_12px_32px_rgba(24,37,29,0.16)]"
            key={id}
            role="status"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#4c7026]"
            />
            <p className="min-w-0 flex-1">{message}</p>
            <button
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-[#627064] transition hover:bg-[#eef2e9] hover:text-[#19251e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7eaa39]"
              onClick={() => dismiss(id)}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}

export function useActionToast(state: ActionFeedback): void {
  const notify = useToast();

  useEffect(() => {
    if (state.notice) {
      notify(state.notice);
    }
  }, [notify, state]);
}
