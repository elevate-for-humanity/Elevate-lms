import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles = 'px-4 py-2 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
      : 'border-slate-300 focus:border-orange-500 focus:ring-brand-blue-500';

    const disabledStyles = props.disabled
      ? 'bg-slate-100 cursor-not-allowed opacity-60'
      : 'bg-white';

    const widthStyle = fullWidth ? 'w-full' : '';

    const paddingStyles = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-black mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`${baseStyles} ${stateStyles} ${disabledStyles} ${widthStyle} ${paddingStyles} ${className}`}
            {...props}
          />

          {rightIcon && !error && !success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}

          {success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="h-5 w-5" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-brand-orange-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {success && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" />
            {success}
          </p>
        )}

        {helperText && !error && !success && (
          <p className="mt-2 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
