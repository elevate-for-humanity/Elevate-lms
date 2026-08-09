import { redirect } from 'next/navigation';

import { ensureWorkOneHandoffByReference } from '@/lib/workone/handoff';

export const dynamic = 'force-dynamic';

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      query.set(key, value[0]);
    }
  }

  if (query.get('type') === 'host-shop') {
    query.delete('type');
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    redirect(`/partners/host-shop/confirmation${suffix}`);
  }

  // The general student application lands here after the application row is
  // committed. Prepare the WIOA/WRG WorkOne packet server-side before the
  // confirmation redirect. The helper verifies funding type and is idempotent,
  // so non-funded applications are ignored and refreshes do not resend email.
  const reference = query.get('ref');
  if (reference && reference.length <= 100) {
    try {
      await ensureWorkOneHandoffByReference(reference);
    } catch {
      // Do not block a valid application confirmation when email is temporarily
      // unavailable. The confirmation page performs one more idempotent attempt.
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  redirect(`/apply/confirmation${suffix}`);
}
