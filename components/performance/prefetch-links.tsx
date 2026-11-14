'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Critical routes to prefetch
const CRITICAL_ROUTES = ['/programs', '/apply', '/contact', '/login', '/about'];

export function PrefetchLinks() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch critical routes after initial load
    const timer = setTimeout(() => {
      CRITICAL_ROUTES.forEach((route) => {
        router.prefetch(route);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}

// Hook for prefetching on hover
export function usePrefetchOnHover(href: string) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(href);
  };

  return { onMouseEnter: handleMouseEnter };
}
