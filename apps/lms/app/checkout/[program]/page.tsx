'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Compatibility route for old LMS checkout links.
 * Payment authority lives in the canonical Elevate enrollment flow.
 */
export default function CheckoutPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/enroll/${encodeURIComponent(params.program)}`);
  }, [params.program, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-3 text-sm text-slate-600">Opening secure enrollment…</p>
      </div>
    </div>
  );
}
