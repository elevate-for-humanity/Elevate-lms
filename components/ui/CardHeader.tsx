import { cn } from '@/lib/utils';

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('p-6 pb-2', className)}>{children}</div>;
}