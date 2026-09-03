/**
 * Legacy route redirect for /programs/esthetician/apply.
 *
 * Preserves old bookmarks, emails, and links that used the short slug.
 * All query parameters (funding, source, referral, campaign) are preserved.
 * The canonical route is /programs/esthetician-apprenticeship/apply.
 */
import { redirect } from 'next/navigation';

type LegacyApplyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyEstheticianApplyPage({
  searchParams,
}: LegacyApplyPageProps) {
  const incoming = await searchParams;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : '';

  redirect(`/programs/esthetician-apprenticeship/apply${suffix}`);
}
