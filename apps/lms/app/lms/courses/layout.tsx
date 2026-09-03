import CanonicalLearnerWorkspaceLayout from '@/components/lms/LearnerWorkspaceLayout';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * The courses route lives outside the learner `(app)` route group because it
 * owns nested course-player routes. Keep the same administrator isolation
 * boundary here so an admin session can never be mistaken for a learner.
 */
export default async function LearnerCoursesLayout({ children }: { children: React.ReactNode }) {
  const userDb = await createClient();
  const {
    data: { user },
  } = await userDb.auth.getUser();

  if (user) {
    const db = await requireAdminClient();
    const [{ data: actor }, subject] = await Promise.all([
      db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      resolvePortalPreviewSubject(db, user.id),
    ]);
    const isAdmin = ['admin', 'super_admin'].includes(String(actor?.role || ''));

    if (isAdmin) {
      return (
        <CanonicalLearnerWorkspaceLayout>
          <main className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              Administrator portal preview
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Courses</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">
              {subject.previewing
                ? 'The learner dashboard preview is read-only. Course records and actions stay in secured Admin management so an administrator cannot accidentally act as the learner.'
                : 'This Student Portal module is operational. No learner identity, enrollment, course, or progress record is attached to the administrator session.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://admin.elevateforhumanity.org/students" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                Select or manage a learner
              </a>
              {subject.previewing ? (
                <a href="/api/admin/preview?end=1" className="rounded-xl border border-amber-400 bg-amber-50 px-5 py-3 text-sm font-black text-amber-950">
                  Exit learner preview
                </a>
              ) : null}
              <a href="/lms/dashboard" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">
                Student PWA overview
              </a>
            </div>
          </main>
        </CanonicalLearnerWorkspaceLayout>
      );
    }
  }

  return <CanonicalLearnerWorkspaceLayout>{children}</CanonicalLearnerWorkspaceLayout>;
}
