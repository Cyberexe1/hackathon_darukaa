import { Link } from 'react-router-dom';

/** 404 — catch-all for unmatched routes, both public and authenticated. */
export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center">
        <span className="font-display text-[3rem] text-primary block mb-space-sm">404</span>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-space-sm">
          Page not found
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg max-w-sm mx-auto">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            home
          </span>
          Back to home
        </Link>
      </div>
    </main>
  );
}
