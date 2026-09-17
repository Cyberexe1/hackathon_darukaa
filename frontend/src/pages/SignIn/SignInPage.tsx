import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation, type Location } from 'react-router-dom';
import { FormField } from '../../components/FormField/FormField';
import { useAuthStore } from '../../store/authStore';
import { authService, getAuthErrorMessage } from '../../services/authService';

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Sign In page. Submits credentials to the FastAPI backend via
 * `authService.signIn()`; on success, persists the returned JWT + user in
 * authStore and redirects to the originally requested route (or
 * /dashboard). Server-side validation errors (invalid credentials, etc.)
 * are surfaced as a friendly banner — never raw error details.
 */
export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { token, user } = await authService.signIn({
        email: email.trim(),
        password,
      });
      login(user, token);
      const redirectTo = (location.state as { from?: Location } | null)?.from;

      navigate(redirectTo ? `${redirectTo.pathname}${redirectTo.search}` : '/dashboard', {
        replace: true,
      });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-space-xl">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg p-space-xl">
        <Link to="/" className="flex items-center gap-space-sm justify-center mb-space-lg">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[18px]" aria-hidden="true">
              public
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-primary">
            DARUKAA.EARTH
          </span>
        </Link>

        <h1 className="font-headline-lg text-headline-lg text-primary mb-1 text-center">Sign in</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-space-xl text-center">
          Welcome back. Enter your credentials to access the platform.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md" noValidate>
          {formError && (
            <p
              role="alert"
              className="font-body-sm text-body-sm text-error bg-error-container/30 border border-error/30 rounded-lg px-space-md py-space-sm"
            >
              {formError}
            </p>
          )}
          <FormField
            id="signin-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <FormField
            id="signin-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <div className="flex justify-end">
            <span className="font-body-sm text-body-sm text-surface-tint">Forgot password?</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-primary mt-space-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span
                className="w-4 h-4 rounded-full border-2 border-on-primary/40 border-t-on-primary animate-spin"
                aria-hidden="true"
              />
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-space-lg">
          Don&rsquo;t have an account?{' '}
          <Link to="/signup" className="text-surface-tint hover:text-primary font-medium">
            Sign up
          </Link>
        </p>

        <Link
          to="/"
          className="flex items-center justify-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant hover:text-primary mt-space-md"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            arrow_back
          </span>
          Back to home
        </Link>
      </div>
    </main>
  );
}
