'use client';

import dynamic from 'next/dynamic';

const EligibilityScreener = dynamic(
  () => import('@/components/funding/EligibilityScreener').then((m) => m.default || m),
  { ssr: false }
);

export default function EligibilityScreenerClient() {
  return <EligibilityScreener />;
}
