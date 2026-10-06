import { redirect } from 'next/navigation';
import { LMS_HOST } from '@/lib/routing/portal-map';

export const dynamic = 'force-dynamic';

/** Preserve old billing links while the authenticated billing UI lives in LMS. */
export default function BillingRedirectPage() {
  redirect(`${LMS_HOST}/billing`);
}
