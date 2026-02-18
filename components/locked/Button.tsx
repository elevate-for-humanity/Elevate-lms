import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary';
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  href,
  variant = 'primary',
  arrow = false,
  className = '',
  onClick,
  type = 'button',
}: ButtonProps) {
  const base =
    'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all';
  const variants = {
    primary: 'bg-brand-orange-600 text-white hover:bg-brand-orange-700 shadow-sm',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {arrow && <ArrowRight className="w-4 h-4" />}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
      {arrow && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}
