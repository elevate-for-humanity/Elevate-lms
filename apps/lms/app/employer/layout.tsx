import type { Metadata } from 'next';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: { default: 'Employer Portal', template: '%s | Elevate Employer' },
  description: 'Hiring, candidates, workforce solutions, and employer operations.',
  manifest: '/manifest-employer.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate Hire',
    statusBarStyle: 'black-translucent',
  },
};

export const dynamic = 'force-dynamic';

export default async function EmployerPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(['employer', 'sponsor', 'admin', 'staff']);
  const pathname = (await headers()).get('x-pathname') || '/employer/dashboard';
  const isAdmin = ['admin', 'super_admin'].includes(String(profile.role || ''));
  const isDashboard = pathname === '/employer' || pathname === '/employer/dashboard';

  if (isAdmin && !isDashboard) {
    const moduleName = pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'employer module';
    return (
      <PlatformShell user={{ id: user.id, email: user.email || '', full_name: profile.full_name || undefined, first_name: profile.first_name || undefined, last_name: profile.last_name || undefined }} role="employer">
        <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Administrator portal preview</p>
          <h1 className="mt-2 text-3xl font-black capitalize text-slate-950">{moduleName}</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">This Employer Portal module is operational. Employer identity, postings, applicants, workforce records, reports, and actions remain isolated from the administrator session.</p>
          <div className="mt-6 flex flex-wrap gap-3"><a href="https://admin.elevateforhumanity.org/employers" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Select or manage an employer</a><a href="/employer/dashboard" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">Employer PWA overview</a></div>
        </main>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
      }}
      role="employer"
    >
      {children}
    </PlatformShell>
  );
}
