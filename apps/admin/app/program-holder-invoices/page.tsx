import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partner Invoices | Admin', robots: { index: false } };
export default async function PartnerInvoicesPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { data: invoices, error } = await db.from('program_holder_documents')
    .select('id,user_id,file_name,status,created_at')
    .eq('document_type', 'provider_invoice').order('created_at', { ascending: false }).limit(200);
  const userIds = [...new Set((invoices || []).map((row: any) => row.user_id))];
  const { data: holders, error: holderError } = userIds.length
    ? await db.from('program_holders').select('id,user_id,organization_name,name').in('user_id', userIds)
    : { data: [], error: null };
  const byUser = new Map((holders || []).map((holder: any) => [holder.user_id, holder]));
  return <main className="space-y-5 p-4 sm:p-8">
    <Link href="/payout-queue" className="font-bold text-blue-800 underline">Payment queue</Link>
    <Link href="/host-shop-finance" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Host Shop invoices, reimbursements &amp; billing corrections</Link>
    <h1 className="text-3xl font-black">Partner invoices</h1>
    <p>Review the invoice, student completion, agreement, scheduled amount and previous payments before paying. An approved document is not a payment confirmation.</p>
    {error || holderError ? <p role="alert">Invoice records could not load. Refresh before reviewing payments.</p> :
      invoices?.length ? invoices.map((invoice: any) => {
        const holder = byUser.get(invoice.user_id) as any;
        return <article key={invoice.id} className="space-y-3 rounded-xl border bg-white p-5">
          <h2 className="text-xl font-bold">{holder?.organization_name || holder?.name || 'Partner'}</h2>
          <p className="break-all">{invoice.file_name}</p><p>Review status: {invoice.status || 'pending'}</p>
          <div className="flex flex-wrap gap-4">
            <a href={`/api/admin/documents/${invoice.id}/view`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">View invoice</a>
            {holder && <><Link href={`/program-holders/verification/${holder.id}/review`} className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Review submission</Link>
              <Link href={`/payout-queue?holder=${holder.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 font-bold text-white">Review &amp; Pay</Link></>}
          </div>
        </article>;
      }) : <p>No partner invoices have been submitted.</p>}
  </main>;
}
