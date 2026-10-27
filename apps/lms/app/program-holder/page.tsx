import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Canonical Program Holder entry point.
 *
 * Keep the namespace root valid so bookmarks, PWA launches, legacy links, and
 * post-auth redirects never fall through to a 404. Authorization remains
 * enforced by the Program Holder layout and dashboard.
 */
export default function ProgramHolderPage() {
  redirect('/program-holder/dashboard');
}
