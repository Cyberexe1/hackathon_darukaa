interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Shared empty-state block used across Projects, Sites, and Analytics
 * pages whenever there is no data to show yet, instead of a blank screen.
 */
export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-space-xl px-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
      <div className="w-14 h-14 rounded-full bg-surface-container-high text-primary flex items-center justify-center mb-space-md">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{title}</h3>
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-space-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm transition-all duration-200 hover:bg-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add
          </span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
