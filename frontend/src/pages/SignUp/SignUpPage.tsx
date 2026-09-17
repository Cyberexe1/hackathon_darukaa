import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../../components/FormField/FormField';
import { useAuthStore } from '../../store/authStore';
import { authService, getAuthErrorMessage } from '../../services/authService';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Sign Up page. Submits the new account to the FastAPI backend via
 * `authService.signUp()`; on success, persists the returned JWT + user in
 * authStore and redirects to /dashboard. Server-side errors (e.g. email
 * already registered) are surfaced as a friendly banner — never raw error
 * details.
 */
export function SignUpPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
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
      const { token, user } = await authService.signUp({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      login(user, token);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to create your account. Please try again.'));
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

        <h1 className="font-headline-lg text-headline-lg text-primary mb-1 text-center">Create your account</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-space-xl text-center">
          Start mapping projects and monitoring biometrics in minutes.
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
            id="signup-name"
            label="Full name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <FormField
            id="signup-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <FormField
            id="signup-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <FormField
            id="signup-confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

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
                <span>Get Started</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-space-lg">
          Already have an account?{' '}
          <Link to="/signin" className="text-surface-tint hover:text-primary font-medium">
            Sign in
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
