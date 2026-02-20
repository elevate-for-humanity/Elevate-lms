'use client';

import type { ReactNode } from 'react';
import { useMounted } from '@/lib/useMounted';

interface ClientOnlyTextProps {
  /** Stable string rendered on the server to avoid hydration mismatch. */
  fallback: ReactNode;
  /** Rendered only on the client after mount. */
  children: ReactNode;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
}

export function ClientOnlyText({ fallback, children, as: Tag = 'span', className }: ClientOnlyTextProps) {
  const mounted = useMounted();
  return <Tag className={className}>{mounted ? children : fallback}</Tag>;
}
