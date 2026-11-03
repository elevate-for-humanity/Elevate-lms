import {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {requireAdminClient} from '@/lib/supabase/admin';
import {resolvePortalPreviewSubject} from '@/lib/admin/portal-preview';
import {resolveApprenticeshipRuntimeContext} from '@/lib/apprenticeship/runtime-context';
import {loadMyDigitalWorkbook,loadMyDigitalWorkbooks} from '@/lib/lms/digital-workbooks';
import DigitalWorkbook from '@/components/lms/DigitalWorkbook';

export const metadata: Metadata = {
  title: 'My Workbook | Apprentice Portal',
  description: 'Open the assigned digital workbook and continue learning.',
  robots: {index:false,follow:false,noarchive:true},
};
export const dynamic = 'force-dynamic';

/**
 * The sidebar's Workbook button must land on a real workbook, not an
 * intermediary that sends the learner back to a course or an unrelated portal.
 */
export default async function ApprenticeWorkbookPage() {
  const auth = await createClient();
  const {data:{user}}=await auth.auth.getUser();
  const admin=await requireAdminClient();
  const subject=await resolvePortalPreviewSubject(admin,user?.id);
  if(!subject.userId) redirect('/login?redirect=/apprentice/workbook');

  const [runtime,available]=await Promise.all([
    resolveApprenticeshipRuntimeContext(admin,{userId:subject.userId,requireRegisteredStandard:false}),
    loadMyDigitalWorkbooks(),
  ]);
  const assignedProgram=runtime?.enrollment?.program_id;
  const assigned=available.workbooks.find(book=>assignedProgram&&book.program_id===assignedProgram);
  const selected=assigned??(available.workbooks.length===1?available.workbooks[0]:null);
  if(selected) {
    const workbook=await loadMyDigitalWorkbook(selected.slug);
    if(workbook)return <DigitalWorkbook key={workbook.accountId+':'+workbook.workbook.id} {...workbook}/>;
  }
  return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-900">
    <h1 className="text-3xl font-bold">My Workbook</h1>
    {available.workbooks.length===0?
      <p role="status" className="mt-6 rounded-xl border border-amber-400 bg-amber-50 p-5">
        No workbook is assigned to this account yet. Contact your training coordinator.
      </p>:
      <><p className="mt-4">Choose the workbook you are studying. Each option opens the workbook itself.</p>
      <div className="mt-6 space-y-3">{available.workbooks.map(book=>
        <Link key={book.id} href={`/workbooks/${encodeURIComponent(book.slug)}`} className="block min-h-12 rounded-lg border bg-white p-4 font-bold underline">{book.title}</Link>
      )}</div></>}
    <Link href="/apprentice" className="mt-8 inline-block underline">Back to apprentice dashboard</Link>
  </main>;
}
