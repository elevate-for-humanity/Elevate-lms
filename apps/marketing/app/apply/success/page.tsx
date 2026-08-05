/**
 * Canonical redirect for student application success.
 *
 * Consolidates ALL submission confirmation pages to this single redirect.
 * Preserves ALL query parameters and redirects to /apply/confirmation.
 *
 * Handles: student, employer, program-holder, staff roles.
 * Handles: enrolled=true (approved), funding, program, ref, etc.
 */
import { redirect } from 'next/navigation';

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

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  redirect(`/apply/confirmation${suffix}`);
}
