import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'School invoices | Elevate Admin' };

export default async function SchoolInvoicesPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const { data, error } = await db.from('school_invoice_orders')
    .select('id,enrollment_id,school_amount_cents,elevate_amount_cents,settlement_status,school_invoice_reference,school_payment_reference,registration_status,created_at')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('School invoice orders could not be loaded.');
  const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  return <main className="mx-auto max-w-7xl p-6">
    <Link href="/enrollments" className="text-blue-700 underline">Back to enrollments</Link>
    <h1 className="my-4 text-3xl font-bold">School invoices</h1>
    <p className="mb-6">Confirmed student payments for Enchanted Hearts programs. Settle the school invoice for the school amount shown here. These records track amounts owed; they do not transfer money. Confirm registration and the start date with the school separately.</p>
    {!data?.length ? <p>No confirmed student payments are awaiting school invoice settlement.</p> :
      <div className="overflow-x-auto"><table className="w-full border-collapse text-left">
        <thead><tr>{['Enrollment', 'School amount', 'Elevate amount', 'Invoice status', 'School invoice', 'Payment reference', 'Registration'].map((title) => <th key={title} className="border p-3">{title}</th>)}</tr></thead>
        <tbody>{data.map((row: any) => <tr key={row.id}>
          <td className="border p-3">{row.enrollment_id}</td>
          <td className="border p-3">{money(row.school_amount_cents)}</td>
          <td className="border p-3">{money(row.elevate_amount_cents)}</td>
          <td className="border p-3">{row.settlement_status.replaceAll('_', ' ')}</td>
          <td className="border p-3">{row.school_invoice_reference || 'Awaiting school invoice'}</td>
          <td className="border p-3">{row.school_payment_reference || 'Unpaid'}</td>
          <td className="border p-3">{row.registration_status}</td>
        </tr>)}</tbody>
      </table></div>}
  </main>;
}
