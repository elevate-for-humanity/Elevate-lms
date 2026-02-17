import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  helperText?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  direction?: 'vertical' | 'horizontal';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  required = false,
  disabled = false,
  direction = 'vertical',
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-black mb-3">
          {label}
          {required && <span className="text-brand-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={`flex ${direction === 'vertical' ? 'flex-col space-y-3' : 'flex-row flex-wrap gap-4'}`}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            helperText={option.helperText}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled || option.disabled}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-brand-orange-600">{error}</p>
      )}
    </div>
  );
};

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, helperText, className = '', id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={radioId}
            className={`
              relative flex items-center justify-center w-5 h-5 border-2 rounded-full
              transition-all duration-200 cursor-pointer
              border-slate-300
              peer-checked:border-brand-blue-600
              peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-brand-blue-500
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              ${className}
            `}
          >
            <div className="w-2.5 h-2.5 bg-brand-orange-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
          </label>
        </div>
        {(label || helperText) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={radioId}
                className="text-sm font-medium text-black cursor-pointer"
              >
                {label}
              </label>
            )}
            {helperText && (
              <p className="text-sm text-slate-500 mt-1">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
