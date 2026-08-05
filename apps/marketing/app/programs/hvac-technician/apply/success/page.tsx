/**
 * HVAC Technician application success — canonical redirect.
 *
 * Consolidates to /apply/confirmation.
 * Preserves all query params: id, payment, session_id.
 */
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Application Submitted | HVAC Technician',
  robots: { index: false },
};

export default async function HvacApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ program: 'hvac-technician' });

  if (params.id && typeof params.id === 'string') {
    query.set('ref', params.id);
  }
  if (params.payment && typeof params.payment === 'string') {
    query.set('payment', params.payment);
  }
  if (params.session_id && typeof params.session_id === 'string') {
    query.set('session_id', params.session_id);
  }

  redirect(`/apply/confirmation?${query.toString()}`);
}
