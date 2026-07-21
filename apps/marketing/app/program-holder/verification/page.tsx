'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProgramHolderVerification() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - verification is handled within the dashboard
    router.replace('/program-holder/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
