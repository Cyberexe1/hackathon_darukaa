import type { ProjectStatus, SiteStatus } from '../../types/dashboard';

type Status = ProjectStatus | SiteStatus;

const STATUS_STYLES: Record<Status, string> = {
  Active: 'bg-primary-fixed text-primary',
  Verified: 'bg-primary-fixed text-primary',
  Planning: 'bg-secondary-container text-on-secondary-fixed',
  'In Review': 'bg-secondary-container text-on-secondary-fixed',
  Completed: 'bg-surface-container-high text-on-surface-variant',
  Paused: 'bg-surface-container-high text-on-surface-variant',
};

const STATUS_DOT: Record<Status, string> = {
  Active: 'bg-surface-tint',
  Verified: 'bg-surface-tint',
  Planning: 'bg-secondary',
  'In Review': 'bg-secondary',
  Completed: 'bg-outline',
  Paused: 'bg-outline',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

/** Small rounded-pill status indicator, consistent with the landing page's site registry table. */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-technical text-label-micro ${STATUS_STYLES[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </span>
  );
}
