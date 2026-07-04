'use client';

/**
 * Handles ?program= query param routing on the /apply page.
 *
 * Runs client-side so the page renders statically.
 * Resolves the program slug and pushes to the correct intake form.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveProgram } from '@/lib/program-registry';

export default function ApplyProgramRedirect({ program }: { program: string }) {
  const router = useRouter();

  useEffect(() => {
    const entry = resolveProgram(program);
    if (!entry) return;
    if (entry.dedicatedApplyPage) {
      router.replace(entry.dedicatedApplyPage);
    } else {
      router.replace(`/apply?program=${entry.slug}`);
    }
  }, [program, router]);

  // Render nothing — page content shows while redirect resolves
  return null;
}
