import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, onCheckedChange, onChange, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="sr-only peer"
            onChange={handleChange}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={`
              relative flex items-center justify-center w-5 h-5 border-2 rounded
              transition-all duration-200 cursor-pointer
              ${error ? 'border-red-500' : 'border-slate-300'}
              peer-checked:bg-brand-orange-600 peer-checked:border-brand-blue-600
              peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-brand-blue-500
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              ${className}
            `}
          >
            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </label>
        </div>
        {(label || helperText || error) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-black cursor-pointer"
              >
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {helperText && !error && (
              <p className="text-sm text-slate-500 mt-1">{helperText}</p>
            )}
            {error && (
              <p className="text-sm text-brand-orange-600 mt-1">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
