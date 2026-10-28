"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="app-dialog"
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-bold tracking-tight text-[#19251e]"
              id={titleId}
            >
              {title}
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-[#5f6c62]"
              id={descriptionId}
            >
              {description}
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-2 text-[#627064] transition hover:bg-[#eef2e9] hover:text-[#19251e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7eaa39]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  );
}
