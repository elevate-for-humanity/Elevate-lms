/**
 * Legacy URL — canonical tracker is /apply/track (same API, richer UX).
 */
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ApplicationStatusRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; email?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const qs = new URLSearchParams();
  if (params.id) qs.set('id', params.id);
  if (params.email) qs.set('email', params.email);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  redirect(`/apply/track${suffix}`);
}
