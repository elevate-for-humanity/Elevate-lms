import { cn } from '@/lib/utils';

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cn('text-sm text-slate-500 mt-1', className)}>{children}</p>;
}