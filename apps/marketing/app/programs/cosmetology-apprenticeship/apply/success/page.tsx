/**
 * Cosmetology Apprenticeship application success — canonical redirect.
 *
 * Consolidates to /apply/confirmation.
 * Preserves all query params: id, funded, session_id.
 */
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Application Received | Cosmetology Apprenticeship',
  description: 'Your cosmetology apprenticeship application has been received. Check your email for next steps.',
  robots: { index: false },
};

export default async function CosmetologyApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ program: 'cosmetology-apprenticeship' });

  if (params.id && typeof params.id === 'string') {
    query.set('ref', params.id);
  }
  if (params.funded && typeof params.funded === 'string') {
    query.set('funded', params.funded);
  }
  if (params.session_id && typeof params.session_id === 'string') {
    query.set('session_id', params.session_id);
  }

  redirect(`/apply/confirmation?${query.toString()}`);
}
