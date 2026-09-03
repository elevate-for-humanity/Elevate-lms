import CanonicalLearnerWorkspaceLayout from '@/components/lms/LearnerWorkspaceLayout';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

export const dynamic = 'force-dynamic';

/**
 * Authenticated learner workspace boundary. The LMS middleware blocks anonymous
 * access before render; this layout adds role authorization and the canonical
 * learner navigation shell for every route in the (app) group.
 */
export default async function LearnerWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  const pathname = (await headers()).get('x-pathname') || '/lms/dashboard';

  if (user) {
    const db = await requireAdminClient();
    const [{ data: actor }, subject] = await Promise.all([
      db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      resolvePortalPreviewSubject(db, user.id),
    ]);
    const isAdmin = ['admin', 'super_admin'].includes(String(actor?.role || ''));
    const isDashboard = pathname === '/lms' || pathname === '/lms/dashboard';
    if (isAdmin && !isDashboard) {
      return <CanonicalLearnerWorkspaceLayout><AdminModulePreview pathname={pathname} previewing={subject.previewing} /></CanonicalLearnerWorkspaceLayout>;
    }
  }

  return <CanonicalLearnerWorkspaceLayout>{children}</CanonicalLearnerWorkspaceLayout>;
}

function AdminModulePreview({ pathname, previewing }: { pathname: string; previewing: boolean }) {
  const moduleName = pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'student module';
  return <main className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Administrator portal preview</p><h1 className="mt-2 text-3xl font-black capitalize text-slate-950">{moduleName}</h1><p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">{previewing ? 'The learner dashboard preview is read-only. Detailed records and actions stay in secured Admin management so an administrator cannot accidentally act as the learner.' : 'This Student Portal module is operational. No learner identity or record is attached to the administrator session.'}</p><div className="mt-6 flex flex-wrap gap-3"><a href="https://admin.elevateforhumanity.org/students" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Select or manage a learner</a>{previewing ? <a href="/api/admin/preview?end=1" className="rounded-xl border border-amber-400 bg-amber-50 px-5 py-3 text-sm font-black text-amber-950">Exit learner preview</a> : null}<a href="/lms/dashboard" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">Student PWA overview</a></div></main>;
}
