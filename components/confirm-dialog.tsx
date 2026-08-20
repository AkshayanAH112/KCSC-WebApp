"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Themed replacement for window.confirm()/alert() — matches the hand-rolled
 * modal style already used throughout the admin console (rounded-3xl white/
 * gray-900 panel over a black/60 backdrop), since this app has no shadcn/
 * Radix Dialog primitive of its own.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  tone = "default",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: "default" | "danger";
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {tone === "danger" && (
            <span className="shrink-0 rounded-full bg-destructive/10 p-2 text-destructive">
              <AlertTriangle size={20} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{description}</p>}
          </div>
        </div>
        {children}
        <div className="flex gap-3 pt-6">{footer}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-border bg-card rounded-xl font-medium text-foreground hover:bg-muted transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl font-medium text-white transition-colors ${
              tone === "danger" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}

export function AlertModal({
  open,
  onClose,
  title,
  description,
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: "default" | "danger";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      footer={
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
        >
          OK
        </button>
      }
    />
  );
}
