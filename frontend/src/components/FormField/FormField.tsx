import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Shared labeled text input with inline validation error, styled per the
 * Darukaa.Earth design tokens (1px outline border, rounded-lg, emerald
 * focus ring). Used by the Sign In and Sign Up forms.
 */
export function FormField({ label, error, id, className, ...inputProps }: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1 text-left">
      <label htmlFor={id} className="font-body-sm text-body-sm font-medium text-on-surface">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`w-full rounded-lg border px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-surface-tint ${
          error ? 'border-error' : 'border-outline-variant'
        } ${className ?? ''}`}
        {...inputProps}
      />
      {error && (
        <span id={errorId} role="alert" className="font-body-sm text-body-sm text-error">
          {error}
        </span>
      )}
    </div>
  );
}
