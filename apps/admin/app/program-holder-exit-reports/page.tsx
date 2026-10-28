import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export default async function Page() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const { data: reports, error } = await db.from('program_holder_reports').select('id,title,status,content,submitted_at,reviewer_notes,metadata')
    .eq('report_type', 'general').contains('metadata', { report_kind: 'testing_readiness' }).order('submitted_at', { ascending: false }).limit(100);
  if (error) throw new Error('Exit reports could not be loaded.');
  return <main className="space-y-5 p-4 sm:p-8"><h1 className="text-3xl font-black">Program Holder exit reports and second-payment requests</h1>
    <p>Verify completion, testing requirements, individual agreement terms, and provider payment history. Invoice requests below are drafts; no money is transferred by report submission.</p>
    {(reports || []).map((report: any) => <article id={report.id} key={report.id} className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">{report.title}</h2><p>Review status: {report.status}</p>
      <p>Draft invoice: {report.metadata?.completion_invoice?.reference || 'Requires review'}</p><p>Invoice status: {report.metadata?.completion_invoice?.status || 'Requires review'}</p>
      <p>Requested amount: {Number.isInteger(report.metadata?.completion_invoice?.amount_cents) ? (report.metadata.completion_invoice.amount_cents / 100).toLocaleString('en-US', {style:'currency',currency:'USD'}) : 'Individual agreement review required'}</p>
      <p>{report.metadata?.completion_invoice?.reason}</p><pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm">{report.content}</pre>
      {report.reviewer_notes && <p>Review notes: {report.reviewer_notes}</p>}
    </article>)}{!reports?.length && <p>No exit reports have been submitted.</p>}
  </main>;
}
