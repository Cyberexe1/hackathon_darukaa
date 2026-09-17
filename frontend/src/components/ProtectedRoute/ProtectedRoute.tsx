import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Guards authenticated routes. On mount, validates any persisted token
 * against `GET /auth/me` so a stale/expired token doesn't render the
 * dashboard with cached user data. Unauthenticated (or invalidated)
 * visitors are redirected to /signin, preserving the originally requested
 * location so the sign-in flow can return them to it.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const hydrate = useAuthStore((state) => state.hydrate);
  const location = useLocation();

  useEffect(() => {
    hydrate();
    // Only re-run if the route mounts again with a token present at that time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span
          className="w-10 h-10 rounded-full border-3 border-surface-tint/30 border-t-surface-tint animate-spin"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
