import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { courseOverviewPath } from '@/lib/lms/routes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Theory / My Lessons | Apprentice' };

export default async function ApprenticeTheoryPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/theory');
  const runtime = await resolveApprenticeshipRuntimeContext(db, {
    userId: subject.userId,
    requireRegisteredStandard: false,
  });
  if (runtime?.enrollment.course_id) {
    redirect(
      subject.previewing
        ? `https://admin.elevateforhumanity.org/api/admin/course-builder/preview?courseId=${runtime.enrollment.course_id}`
        : courseOverviewPath(runtime.enrollment.course_id),
    );
  }
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-3xl font-bold">Theory / My Lessons</h1>
      <p role="status">
        Your theory course has not been assigned yet. Contact your program staff to connect the
        correct course.
      </p>
      <Link
        href="/lms/support"
        className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
      >
        Get course help
      </Link>
    </main>
  );
}
