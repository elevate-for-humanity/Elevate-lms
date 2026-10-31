import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { getBeautyApprenticeshipConfig } from '@/lib/apprenticeship/beauty-program-config';
import ProgramSyllabusReader from '@/components/learner/ProgramSyllabusReader';
export const dynamic = 'force-dynamic';
export default async function ApprenticeSyllabusPage() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/syllabus');
  const slug = await resolveApprenticeProgramSlug(db, subject.userId);
  const program = slug ? getBeautyApprenticeshipConfig(slug) : null;
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-5">
      <h1 className="text-3xl font-bold">Course Syllabus</h1>
      {program ? (
        <ProgramSyllabusReader
          title={`${program.label} apprenticeship syllabus`}
          path={program.syllabusHref}
        />
      ) : (
        <p role="status">Ask your program staff to connect your assigned syllabus.</p>
      )}
    </main>
  );
}
