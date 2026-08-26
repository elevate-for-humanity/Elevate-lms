import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { smsService } from '@/lib/notifications/sms';
import { SmsComposer } from './SmsComposer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SMS Delivery | Admin',
};

type SmsDelivery = {
  id: string;
  recipient: string | null;
  status: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

function maskPhone(value: string | null) {
  if (!value) return 'Unknown';
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? `••• ••• ${digits.slice(-4)}` : '••••';
}

function statusClass(status: string | null) {
  const normalized = status?.toLowerCase();
  if (normalized === 'sent' || normalized === 'delivered') {
    return 'bg-green-100 text-green-800';
  }
  if (normalized === 'failed' || normalized === 'undelivered') {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-amber-100 text-amber-800';
}

export default async function SmsDeliveryPage() {
  await requireRole(['admin', 'staff']);
  const admin = await requireAdminClient();
  const [{ data, error }, { data: recipientRows }] = await Promise.all([
    admin.from('delivery_logs').select('id, recipient, status, provider_message_id, error_message, sent_at, created_at').eq('channel', 'sms').order('created_at', { ascending: false }).limit(250),
    admin.from('profiles').select('id, full_name, email, phone').not('phone', 'is', null).order('full_name', { ascending: true }).limit(1000),
  ]);

  if (error) {
    throw new Error(`Unable to load SMS delivery logs: ${error.message}`);
  }

  const deliveries = (data ?? []) as SmsDelivery[];
  const delivered = deliveries.filter((item) =>
    ['sent', 'delivered'].includes(item.status?.toLowerCase() ?? ''),
  ).length;
  const failed = deliveries.filter((item) =>
    ['failed', 'undelivered'].includes(item.status?.toLowerCase() ?? ''),
  ).length;

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">SMS Delivery</h1>
        <p className="mt-1 text-sm text-gray-600">
          Twilio delivery attempts recorded by the notification service. Recipients are masked.
        </p>
      </div>

      <SmsComposer enabled={smsService.isEnabled()} recipients={(recipientRows ?? []).filter((row: any) => String(row.phone || '').replace(/\D/g, '').length >= 10)} />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="SMS delivery summary">
        {[
          ['Recent attempts', deliveries.length],
          ['Sent or delivered', delivered],
          ['Failed', failed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Provider ID</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveries.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {new Date(item.sent_at ?? item.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-950">
                    {maskPhone(item.recipient)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                      {item.status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="max-w-56 truncate px-4 py-3 font-mono text-xs text-gray-600">
                    {item.provider_message_id ?? '—'}
                  </td>
                  <td className="max-w-md px-4 py-3 text-red-700">
                    {item.error_message ?? '—'}
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No SMS delivery attempts have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
