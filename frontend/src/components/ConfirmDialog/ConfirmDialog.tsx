import { Modal } from '../Modal/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic destructive-action confirmation dialog (e.g. "Delete this
 * environmental measurement? This action cannot be undone."). Reused
 * anywhere a delete needs explicit confirmation rather than a silent
 * click-to-delete.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  isConfirming,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} widthClassName="max-w-md">
      <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">{description}</p>
      <div className="flex items-center justify-end gap-space-sm">
        <button
          type="button"
          onClick={onCancel}
          className="px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="inline-flex items-center gap-space-sm bg-error text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isConfirming ? (
            <span
              className="w-4 h-4 rounded-full border-2 border-on-primary/40 border-t-on-primary animate-spin"
              aria-hidden="true"
            />
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}
