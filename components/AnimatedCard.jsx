import React from 'react';
import { Card } from './ui/Card';
import { cn } from '@/lib/utils';

export function AnimatedCard({ children, className, delay = 0, ...props }) {
  return (
    <Card
      className={cn('opacity-0 animate-fade-in-up', className)}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
      {...props}
    >
      {children}
    </Card>
  );
}

export default AnimatedCard;
