import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
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
  const { data: { user } } = await supabase.auth.getUser();

  const h = await headers();
  const pathname = h.get('x-pathname') || (await cookies()).get('__efh_pathname')?.value || '/apprentice';

  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, first_name, last_name, avatar_url')
    .eq('id', subject.userId)
    .maybeSingle();

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
    >
      {subject.previewing && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span>
            Admin preview: viewing {profile?.full_name || 'this learner'}&apos;s apprentice dashboard.
          </span>
          <a className="font-semibold underline" href="/api/admin/preview?end=1">
            Exit preview
          </a>
        </div>
      )}
      <div className="mt-4">{children}</div>
      <ParisFloatingWrapper
        surface="learner"
        courseTitle={beautyProgram ? `${beautyProgram.label} Apprenticeship` : programSlug?.replace(/[-_]/g, ' ') || 'Apprenticeship'}
        nextLessonTitle="Complete the required items highlighted in red on your apprentice dashboard"
      />
    </PlatformShell>
  );
}
