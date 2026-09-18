import { create } from 'zustand';
import type { User } from '../types/dashboard';
import { authService } from '../services/authService';

const TOKEN_KEY = 'darukaa_auth_token';
const USER_KEY = 'darukaa_auth_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while the stored token is being validated against GET /auth/me on app load. */
  isHydrating: boolean;
  /** True once `hydrate()` has run at least once this session (avoids redundant calls). */
  hasHydrated: boolean;
  /** Sets the session after a successful sign in/up. Persists the token only. */
  login: (user: User, token: string) => void;
  logout: () => void;
  /**
   * Validates a persisted token against the backend on app startup. If the
   * token is stale/expired/invalid, clears the session so ProtectedRoute
   * redirects to /signin instead of the dashboard rendering with a stale
   * cached user. Safe to call multiple times — only runs once per session.
   */
  hydrate: () => Promise<void>;
}

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// `login` is invoked by the SignIn/SignUp pages with the JWT + user
// returned from the FastAPI backend (see services/authService.ts). The
// user object is also cached locally (non-sensitive display info only) so
// the UI doesn't fall back to "Guest" after a page refresh; apiClient's
// response interceptor clears the token on any 401, which combined with
// ProtectedRoute logs the user out automatically once the token expires
// or is rejected by the server.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: readStoredUser(),
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  isAuthenticated: typeof window !== 'undefined' && Boolean(localStorage.getItem(TOKEN_KEY)),
  // Start "hydrating" whenever a token is already present, so
  // ProtectedRoute shows a loading state instead of briefly rendering
  // cached (possibly stale) user data before validation completes.
  isHydrating: typeof window !== 'undefined' && Boolean(localStorage.getItem(TOKEN_KEY)),
  hasHydrated: false,

  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isHydrating: false, hasHydrated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const { token, hasHydrated } = get();
    if (hasHydrated) return;
    if (!token) {
      set({ hasHydrated: true, isHydrating: false });
      return;
    }

    set({ isHydrating: true });
    try {
      const user = await authService.getCurrentUser();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      // Token is invalid/expired — apiClient's 401 interceptor already
      // cleared it from localStorage; mirror that in the store state.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isHydrating: false, hasHydrated: true });
    }
  },
}));

// apiClient's response interceptor dispatches this event the instant any
// request gets a 401 (e.g. the token expired mid-session), after it has
// already cleared the token from localStorage. Mirror that into the
// in-memory store synchronously so ProtectedRoute redirects to /signin
// immediately, rather than waiting for the next hydrate()/page load.
if (typeof window !== 'undefined') {
  window.addEventListener('darukaa:unauthorized', () => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });
}
