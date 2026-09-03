'use client';

import dynamic from 'next/dynamic';

const Confetti = dynamic(
  () => import('@/components/Confetti').then((m) => m.default || m),
  { ssr: false }
);

export default function ConfettiWrapper() {
  return <Confetti />;
}
