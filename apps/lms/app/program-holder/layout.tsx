import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ProgramHolderPhoneReceiver } from '@/components/program-holder/ProgramHolderPhoneReceiver';
import { ProgramHolderMobileNav } from '@/components/program-holder/ProgramHolderMobileNav';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

const PORTAL_LINKS = [
  ['Dashboard', '/program-holder/dashboard'],
  ['Students', '/program-holder/students'],
  ['Applicants', '/program-holder/students/pending'],
  ['Programs', '/program-holder/programs'],
  ['Hours', '/program-holder/hours'],
  ['Meetings', '/program-holder/meetings'],
  ['Phone', '/program-holder/phone'],
  ['AirScript', '/program-holder/airscript'],
  ['Email', '/program-holder/email'],
  ['Community', '/program-holder/community'],
  ['Career Feed', '/program-holder/career'],
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
  const context = await requireProgramHolder();
  const profileName = context.profile?.full_name || 'Program Holder';
  const avatarUrl = context.profile?.avatar_url?.trim();
  const initials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <>
      <nav
        aria-label="Program Holder portal"
        className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur"
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2">
          <ProgramHolderMobileNav links={PORTAL_LINKS} />
          <div className="hidden min-w-0 flex-wrap items-center gap-1 md:flex">
            {PORTAL_LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800"
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            href="/program-holder/settings"
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-2 sm:pr-3"
            aria-label={`Open ${profileName} profile settings`}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profileName}
                width={38}
                height={38}
                className="h-9 w-9 rounded-full object-cover object-top"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">
                {initials || 'PH'}
              </span>
            )}
            <span className="hidden max-w-40 truncate text-sm font-black text-slate-800 sm:inline">{profileName}</span>
          </Link>
        </div>
      </nav>
      <ProgramHolderPhoneReceiver />
      {children}
    </>
  );
}
