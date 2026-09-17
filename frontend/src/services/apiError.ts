import axios from 'axios';

/**
 * Extracts a friendly, user-facing message from an API error without ever
 * surfacing raw stack traces or backend exception details. Falls back to
 * `fallback` when the response doesn't carry a recognizable `detail`
 * string (e.g. network failure or an unexpected 5xx).
 *
 * Shared across all service modules (auth, project, site, ...) so every
 * API error surfaced in the UI goes through the same sanitization.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
    if (error.response.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      // FastAPI/Pydantic 422 validation errors come back as a list of
      // {loc, msg, type} objects — surface the first human-readable msg.
      const first = detail.find((d) => typeof d?.msg === 'string');
      if (first) return first.msg as string;
    }
  }
  return fallback;
}
