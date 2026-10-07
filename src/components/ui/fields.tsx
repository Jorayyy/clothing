'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
}

export function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      {children({ id, describedBy })}
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, required, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn('input', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function NumberField({ label, hint, error, required, className, ...props }: NumberFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy }) => (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn('input', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn('input', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string; disabled?: boolean }[];
};

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn('input appearance-none pr-8', className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
}

export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className={cn(
          'mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--site-accent)]',
          className,
        )}
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-ink">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-line bg-bg',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-surface shadow transition-transform duration-200',
            'h-[1.1rem] w-[1.1rem]',
            checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5',
          )}
          style={{ left: 0 }}
        />
      </button>
    </div>
  );
}
