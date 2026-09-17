interface SkeletonProps {
  className?: string;
}

/** Base shimmering skeleton block. Compose these into page-specific loaders. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-container-high ${className}`}
      aria-hidden="true"
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
      <Skeleton className="h-3 w-24 mb-space-md" />
      <Skeleton className="h-8 w-20 mb-space-sm" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full min-h-[320px] rounded-2xl bg-surface-container-high animate-pulse flex items-center justify-center">
      <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden="true">
        map
      </span>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="p-space-lg border-b border-outline-variant/20">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="divide-y divide-outline-variant/20">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-space-lg flex items-center gap-space-md">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
      <Skeleton className="h-4 w-40 mb-space-md" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function SitePanelSkeleton() {
  return (
    <div className="p-space-lg space-y-space-md">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-space-sm">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
