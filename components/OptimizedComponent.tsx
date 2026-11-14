import { memo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export const OptimizedComponent = memo(function OptimizedComponent({ children }: Props) {
  return <>{children}</>;
});
