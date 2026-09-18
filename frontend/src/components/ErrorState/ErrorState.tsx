interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/**
 * Shared error-state block. Never surfaces raw error messages/stack
 * traces — always a friendly title plus an optional retry action.
 */
export function ErrorState({
  title = 'Unable to load data.',
  description = 'Something went wrong while fetching this content.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-space-xl px-space-md rounded-2xl bg-surface-container-lowest border border-error/30">
      <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          error
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-space-md">
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-space-sm bg-surface-container-lowest text-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm shadow-sm transition-all duration-200 hover:bg-surface-container border border-outline-variant/40"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            refresh
          </span>
          Retry
        </button>
      )}
    </div>
  );
}
