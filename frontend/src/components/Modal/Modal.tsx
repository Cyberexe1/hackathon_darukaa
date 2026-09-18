import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional footer, typically Cancel/Confirm buttons. */
  footer?: ReactNode;
  widthClassName?: string;
}

/**
 * Centered modal dialog with a scale-in entrance, backdrop dismiss, and
 * Escape-to-close. Used for Create Project and other short forms. On
 * small screens the panel grows to fill most of the viewport.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  widthClassName = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${widthClassName} max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-xl animate-scale-in`}
      >
        <div className="flex items-center justify-between px-space-lg py-space-md border-b border-outline-variant/30">
          <h2 id="modal-title" className="font-headline-sm text-headline-sm text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <div className="px-space-lg py-space-lg">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-space-sm px-space-lg py-space-md border-t border-outline-variant/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
