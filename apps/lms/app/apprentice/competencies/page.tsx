import type { Metadata } from 'next';
import Link from 'next/link';
import AppendixAProgress from './AppendixAProgress.client';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export const metadata: Metadata = {
  title: 'Competency Progress | Apprentice Portal',
  description: 'Track approved apprenticeship competencies and related instruction requirements.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeCompetenciesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/competencies');
  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  const standard = programSlug ? getRegisteredProgramStandard(programSlug) : null;
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/apprentice" className="text-sm font-medium text-brand-blue-700 hover:underline">
            ← Apprentice Dashboard
          </Link>
        </div>
        {standard ? (
          <div className="mb-5 rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-sm text-cyan-950">
            <p className="font-bold">{standard.standard.occupationTitle} · Appendix A {standard.standard.rapidsCode}</p>
            <p className="mt-1">Track {standard.completion.competencyCount} verified competencies and {standard.completion.requiredRtiHours} required RTI hours under the approved occupation standard.</p>
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-bold">Registered competency standard pending configuration</p>
            <p className="mt-1">Hours, attendance, theory, documents, and Host Shop tools remain available. Verified competency sign-off activates only when the sponsor&apos;s approved Appendix A is loaded.</p>
          </div>
        )}
        <AppendixAProgress />
      </div>
    </div>
  );
}
