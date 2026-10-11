import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

export type ConfirmTone = "danger" | "brand";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4">
      <div
        aria-hidden
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="glypt-confirm-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-ink bg-white p-6 shadow-[8px_8px_0_0_var(--color-ink)]"
      >
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none absolute -top-14 -right-14 size-36 rotate-12 rounded-[2rem] border-4",
            tone === "danger" ? "border-berry-soft" : "border-tang-soft",
          )}
        />
        <div className="relative flex items-start gap-3">
          <span
            className={clsx(
              "grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-[3px_3px_0_0_var(--color-ink)]",
              tone === "danger" ? "bg-berry" : "bg-tang",
            )}
          >
            <Icon
              icon={tone === "danger" ? "ph:warning-diamond-bold" : "ph:question-bold"}
              className="size-5"
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h2 id="glypt-confirm-title" className="font-display text-xl font-bold text-ink">
              {title}
            </h2>
            {message && <div className="mt-1.5 text-sm leading-relaxed text-mute">{message}</div>}
          </div>
        </div>
        <div className="relative mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-ghost flex-1 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={clsx(
              "btn flex-1 text-white disabled:opacity-60",
              tone === "danger" ? "bg-berry hover:bg-berry/90" : "bg-tang hover:bg-tang-hi",
            )}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
