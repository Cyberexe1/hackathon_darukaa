import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiError';
import type { User } from '../types/dashboard';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Wired to the FastAPI backend (JWT bearer token + bcrypt-hashed password
// verification handled server-side). See backend/app/api/routes/auth.py.
export const authService = {
  async signIn(input: SignInInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/signin', input);
    return data;
  },

  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/signup', input);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};

/** @deprecated Use `getApiErrorMessage` from `./apiError` directly. Kept as a
 * re-export so existing imports (SignInPage/SignUpPage) keep working. */
export const getAuthErrorMessage = getApiErrorMessage;
