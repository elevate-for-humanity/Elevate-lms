'use client';

import { useEffect, useState } from 'react';

interface CopyrightProps {
  entity?: string;
  className?: string;
}

/**
 * Renders the copyright year client-side to avoid server/client hydration
 * mismatch from new Date().getFullYear() differing across render environments.
 */
export default function Copyright({
  entity = 'Elevate for Humanity',
  className,
}: CopyrightProps) {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (!year) return null;

  return (
    <span className={className}>
      © {year} {entity}
    </span>
  );
}
