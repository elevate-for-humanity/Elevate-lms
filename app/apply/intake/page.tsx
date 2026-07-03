export const dynamic = 'force-dynamic';
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * /apply/intake redirects to /apply — the canonical intake URL.
 * Preserves ?program= query param so pre-filled links still work.
 */
export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;
  if (program) {
    permanentRedirect(`/apply?program=${program}`);
  }
  permanentRedirect('/apply');
}
