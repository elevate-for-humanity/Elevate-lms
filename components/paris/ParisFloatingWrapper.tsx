'use client';

import dynamic from 'next/dynamic';

// Dynamically import ParisFloatingButton to avoid SSR issues
const ParisFloatingButton = dynamic(
  () => import('./ParisFloatingButton').then((mod) => mod.ParisFloatingButton),
  {
    ssr: false,
    loading: () => null,
  }
);

export function ParisFloatingWrapper() {
  return <ParisFloatingButton />;
}

export default ParisFloatingWrapper;
