/**
 * Staff portal — role gate + no static cache (student PII must never be ISR-cached).
 */
import type { Metadata } from 'next';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';
import { PlatformShell } from '@/components/platform/PlatformShell';
import Link from 'next/link';
import { PORTAL_MAP } from '@/lib/routing/portal-map';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, effectiveRoles } = await requireStaffPortalAccess();
  return (
    <PlatformShell
      user={{
        ...user,
        email: user.email || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url || undefined,
      }}
      role="staff"
    >
      {effectiveRoles.some((role) => role === 'student' || role === 'learner') ? (
        <div className="border-b border-slate-200 px-4 py-3 text-sm">
          Staff workspace ·{' '}
          <Link
            className="font-semibold underline"
            href={`${PORTAL_MAP.lms.host}${PORTAL_MAP.lms.defaultPath}`}
          >
            Open my separate learning dashboard
          </Link>
        </div>
      ) : null}
      {children}
    </PlatformShell>
  );
}
