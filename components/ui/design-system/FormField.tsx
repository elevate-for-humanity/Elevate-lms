/**
 * FormField — Unified form field wrapper for all portals and public forms.
 *
 * Eliminates the pattern of hand-rolling label + input + error message on every form.
 * Supports text, email, tel, password, number, textarea, and select inputs.
 *
 * Usage:
 *   <FormField label="Email" name="email" type="email" required error={errors.email} />
 *   <FormField label="Notes" name="notes" as="textarea" rows={4} />
 *   <FormField label="Status" name="status" as="select">
 *     <option value="active">Active</option>
 *   </FormField>
 */

import React from 'react';
import { cn } from '@/lib/utils';

type InputType = 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'url' | 'search';

interface BaseProps {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

interface InputProps extends BaseProps {
  as?: 'input';
  type?: InputType;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  readOnly?: boolean;
}

interface TextareaProps extends BaseProps {
  as: 'textarea';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  rows?: number;
  readOnly?: boolean;
}

interface SelectProps extends BaseProps {
  as: 'select';
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}

type FormFieldProps = InputProps | TextareaProps | SelectProps;

const inputBase =
  'block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ' +
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';

const inputNormal = 'border-slate-300 bg-white focus:border-brand-blue-500 focus:ring-brand-blue-200';
const inputError  = 'border-brand-red-400 bg-red-50 focus:border-brand-red-500 focus:ring-red-200';

export function FormField(props: FormFieldProps) {
  const { label, name, hint, error, required, disabled, className, labelClassName } = props;
  const fieldClass = cn(inputBase, error ? inputError : inputNormal);
  const id = name;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={id}
        className={cn('text-sm font-medium text-slate-700', labelClassName)}
      >
        {label}
        {required && <span className="text-brand-red-500 ml-0.5" aria-hidden>*</span>}
      </label>

      {props.as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          rows={(props as TextareaProps).rows ?? 3}
          placeholder={(props as TextareaProps).placeholder}
          value={(props as TextareaProps).value}
          defaultValue={(props as TextareaProps).defaultValue}
          onChange={(props as TextareaProps).onChange}
          onBlur={(props as TextareaProps).onBlur}
          disabled={disabled}
          readOnly={(props as TextareaProps).readOnly}
          required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          className={cn(fieldClass, 'resize-y min-h-[80px]')}
        />
      ) : props.as === 'select' ? (
        <select
          id={id}
          name={name}
          value={(props as SelectProps).value}
          defaultValue={(props as SelectProps).defaultValue}
          onChange={(props as SelectProps).onChange}
          onBlur={(props as SelectProps).onBlur}
          disabled={disabled}
          required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          className={cn(fieldClass, 'pr-8 appearance-none bg-no-repeat bg-right-3')}
        >
          {(props as SelectProps).children}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={(props as InputProps).type ?? 'text'}
          placeholder={(props as InputProps).placeholder}
          value={(props as InputProps).value}
          defaultValue={(props as InputProps).defaultValue}
          onChange={(props as InputProps).onChange}
          onBlur={(props as InputProps).onBlur}
          autoComplete={(props as InputProps).autoComplete}
          min={(props as InputProps).min}
          max={(props as InputProps).max}
          step={(props as InputProps).step}
          disabled={disabled}
          readOnly={(props as InputProps).readOnly}
          required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          className={fieldClass}
        />
      )}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-brand-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
