import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { getBeautyApprenticeshipConfig } from '@/lib/apprenticeship/beauty-program-config';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, RTI, competencies, documents, and host-site progress.',
  manifest: '/manifest-apprentice.json',
  appleWebApp: {
    capable: true,
    title: 'Elevate Apprentice',
    statusBarStyle: 'black-translucent',
  },
};
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const h = await headers();
  const pathname =
    h.get('x-pathname') || (await cookies()).get('__efh_pathname')?.value || '/apprentice';

  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  const [{ data: profile }, { data: actorProfile }] = await Promise.all([
    db
      .from('profiles')
      .select('id, role, full_name, first_name, last_name, avatar_url, onboarding_completed')
      .eq('id', subject.userId)
      .maybeSingle(),
    user
      ? db
          .from('profiles')
          .select('id, role, full_name, first_name, last_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  const beautyProgram = programSlug ? getBeautyApprenticeshipConfig(programSlug) : null;
  const privileged = ['admin', 'super_admin', 'staff'].includes(String(profile?.role || ''));

  if (!privileged && !programSlug) {
    redirect('/lms/dashboard?notice=apprentice-access-required');
  }

  const breadcrumbs = generateBreadcrumbs(pathname).map((crumb) => {
    if (crumb.label === 'Apprentice') return { label: 'Apprentice Portal', href: crumb.href };
    return crumb;
  });

  const actorIsAdmin = ['admin', 'super_admin'].includes(String(actorProfile?.role || ''));
  const isDashboard = pathname === '/apprentice' || pathname === '/apprentice/dashboard';
  if (actorIsAdmin && !subject.previewing && !isDashboard) {
    const moduleName =
      pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'apprentice module';
    return (
      <PlatformShell
        user={{
          id: user!.id,
          email: user?.email || '',
          full_name: actorProfile?.full_name || undefined,
          first_name: actorProfile?.first_name || undefined,
          last_name: actorProfile?.last_name || undefined,
          avatar_url: actorProfile?.avatar_url || undefined,
        }}
        role="apprentice"
        breadcrumbs={breadcrumbs}
      >
        <main className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">
            Administrator portal preview
          </p>
          <h1 className="mt-2 text-3xl font-black capitalize text-slate-950">{moduleName}</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">
            Select an apprentice in Admin to view this page with their saved records. No apprentice
            is selected in this session, so their hours, payments, and documents are not shown.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://admin.elevateforhumanity.org/students"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Select or manage a learner
            </a>
            <a
              href="/apprentice"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950"
            >
              Apprentice PWA overview
            </a>
          </div>
        </main>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      user={{
        id: subject.userId,
        email: subject.previewing ? '' : user?.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="apprentice"
      breadcrumbs={breadcrumbs}
      paris={{
        surface: 'learner',
        courseTitle: beautyProgram
          ? `${beautyProgram.label} Apprenticeship`
          : programSlug?.replace(/[-_]/g, ' ') || 'Apprenticeship',
        nextLessonTitle:
          'Review your next step and setup checklist on your apprentice dashboard',
      }}
    >
      {subject.previewing && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span>
            Admin preview: viewing {profile?.full_name || 'this learner'}&apos;s apprentice
            dashboard.
          </span>
          <a className="font-semibold underline" href="/api/admin/preview?end=1">
            Exit preview
          </a>
        </div>
      )}
      {!profile?.onboarding_completed && (
        <section
          className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          role="status"
          aria-label="Apprentice start notice"
        >
          <div>
            <h2 className="font-semibold text-slate-950">Your enrollment checklist</h2>
            <p className="mt-1 text-sm text-slate-600">Review your documents and training setup before you begin.</p>
          </div>
          <a href="/apprentice/documents"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Review checklist →
          </a>
        </section>
      )}
      <div className="mt-4">{children}</div>
    </PlatformShell>
  );
}
