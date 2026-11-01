import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Host Shop Finance Requests | Admin', robots: { index: false } };
const TYPES = ['host_shop_invoice', 'host_shop_reimbursement', 'host_shop_billing_correction'];
async function review(form: FormData) {
  'use server';
  const { user } = await requireRole(['admin', 'super_admin']);
  const id = String(form.get('id') || ''), decision = String(form.get('decision') || '');
  const notes = String(form.get('notes') || '').trim();
  if (!['accepted','rejected'].includes(decision) || notes.length < 3 || notes.length > 1000)
    throw new Error('Select a decision and enter a review note.');
  const db = await requireAdminClient();
  const result = await db.from('partner_documents').update({
    status: decision, notes, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
  }).eq('id', id).in('document_type', TYPES).eq('status', 'pending').select('id').single();
  if (result.error || !result.data) throw new Error('This request could not be reviewed or has already been processed.');
  revalidatePath('/host-shop-finance');
}
export default async function HostShopFinanceReview() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();
  const result = await db.from('partner_documents')
    .select('id,partner_id,display_name,file_name,document_type,status,notes,created_at,partners(name)')
    .in('document_type', TYPES).order('created_at', {ascending:false}).limit(200);
  if (result.error) throw new Error('Host Shop finance requests could not load.');
  return <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <div className="flex flex-wrap gap-4"><Link href="/partners" className="min-h-11 font-bold underline">Host Shops</Link><Link href="/program-holder-invoices" className="min-h-11 font-bold underline">Program Holder invoices</Link></div>
    <h1 className="text-3xl font-black">Host Shop finance requests</h1>
    <p>Review submitted invoices, reimbursement requests, and billing corrections. Accepting a request starts processing; payment must be completed and recorded through the existing finance process.</p>
    {!result.data?.length ? <p>No finance requests have been submitted.</p> : result.data.map((row:any) => <article key={row.id} className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="text-xl font-bold">{row.partners?.name || 'Host Shop'}</h2>
      <p className="break-all font-semibold">{row.display_name || row.file_name}</p>
      <p className="text-sm">{row.document_type.replaceAll('_',' ')} · {row.status}</p>
      <a href={'/api/admin/host-shop-finance/'+row.id+'/download'} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">View submitted request</a>
      {row.notes && <p className="text-sm">Review note: {row.notes}</p>}
      {row.status === 'pending' && <form action={review} className="grid gap-3">
        <input type="hidden" name="id" value={row.id} />
        <label className="grid gap-1 text-sm font-bold">Review note<textarea name="notes" required minLength={3} maxLength={1000} rows={3} className="rounded-lg border p-2" /></label>
        <div className="flex flex-wrap gap-3"><button name="decision" value="accepted" className="min-h-11 rounded-lg bg-blue-800 px-4 py-2 font-bold text-white">Accept for processing</button>
        <button name="decision" value="rejected" className="min-h-11 rounded-lg border border-red-300 px-4 py-2 font-bold text-red-800">Return / reject request</button></div>
      </form>}
    </article>)}
  </main>;
}
