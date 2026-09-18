import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { PROGRAM_HOLDER_ROLES } from '@/lib/rbac/role-matrix';
import Link from 'next/link';

const PORTAL_LINKS = [
  ['Dashboard', '/program-holder/dashboard'],
  ['Students', '/program-holder/students'],
  ['Applicants', '/program-holder/students/pending'],
  ['Programs', '/program-holder/programs'],
  ['Hours', '/program-holder/hours'],
  ['Meetings', '/program-holder/meetings'],
  ['Office Mail', '/program-holder/inbox'],
  ['Documents', '/program-holder/documents'],
  ['Compliance', '/program-holder/compliance'],
  ['Reports', '/program-holder/reports'],
  ['Payouts', '/program-holder/payouts'],
  ['Orientation', '/program-holder/how-to-use'],
] as const;

export const metadata: Metadata = {
  title: { default: 'Program Holder Portal', template: '%s | Elevate Program Holder' },
  description:
    'Manage approved programs, students, documents, training hours, and compliance actions.',
  manifest: '/manifest-program-holder.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate Program Holder',
    statusBarStyle: 'black-translucent',
  },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect every Program Holder route, including pages that do not perform
  // their own data lookup. Page-level guards remain defense in depth.
  await requireRole(PROGRAM_HOLDER_ROLES);

  return (
    <>
      <nav
        aria-label="Program Holder portal"
        className="sticky top-0 z-40 overflow-x-auto border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur"
      >
        <div className="mx-auto flex min-w-max max-w-[1600px] items-center gap-2">
          {PORTAL_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800">
              {label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
