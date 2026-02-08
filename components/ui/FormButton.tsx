'use client';

import { ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function FormButton({
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}: FormButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-lg font-semibold
        transition-all duration-200
        ${loading || disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700 active:scale-95'
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
