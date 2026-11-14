/**
 * Peer Recovery Specialist application success — canonical redirect.
 *
 * Consolidates to /apply/confirmation.
 * Preserves all query params: id, ref.
 */
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Application Submitted | Peer Recovery Specialist',
  robots: { index: false, follow: false },
};

export default async function PeerRecoveryApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ program: 'peer-recovery-specialist' });

  if (params.id && typeof params.id === 'string') {
    query.set('ref', params.id);
  }
  if (params.ref && typeof params.ref === 'string') {
    query.set('ref', params.ref);
  }

  redirect(`/apply/confirmation?${query.toString()}`);
}
