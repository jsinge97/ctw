import { AlertTriangle } from "lucide-react";
import { Button } from "./button.js";

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  isLoading = false,
  message,
  onCancel,
  onConfirm,
  title
}: {
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-modal="true" className="dialog" role="dialog" aria-labelledby="confirm-dialog-title">
        <span className="dialog-icon">
          <AlertTriangle size={18} aria-hidden />
        </span>
        <div>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="action-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
