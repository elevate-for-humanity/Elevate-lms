
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'destructive'
    | 'outline'
    | 'ghost'
    | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      asChild = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      default: 'bg-brand-orange-600 text-white hover:bg-brand-orange-700 focus:ring-brand-blue-500',
      primary: 'bg-brand-orange-600 text-white hover:bg-brand-orange-700 focus:ring-brand-blue-500',
      secondary:
        'bg-white text-black border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-500',
      tertiary:
        'bg-transparent text-brand-orange-600 hover:bg-gray-50 focus:ring-brand-blue-500',
      danger: 'bg-brand-orange-600 text-white hover:bg-brand-orange-700 focus:ring-red-500',
      destructive: 'bg-brand-orange-600 text-white hover:bg-brand-orange-700 focus:ring-red-500',
      outline:
        'bg-white text-black border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-500',
      ghost:
        'bg-transparent text-black hover:bg-slate-100 focus:ring-slate-500',
      link: 'text-brand-orange-600 underline-offset-4 hover:underline focus:ring-brand-blue-500',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded min-h-[40px]',
      md: 'px-5 py-3 text-base rounded-md min-h-[48px]',
      lg: 'px-8 py-4 text-lg rounded-lg min-h-[56px]',
      icon: 'h-12 w-12 p-0 rounded-md',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

    // If asChild is true, render children directly with className applied
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: combinedClassName,
        ...props,
      } as string);
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
