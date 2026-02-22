export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Calendar, Plus, XCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Time Off | Employee Portal',
  description: 'View and request time off.',
  robots: { index: false, follow: false },
};

export default async function TimeOffPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employee/time-off');
  }

  const { data: requests } = await db
    .from('time_off_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const items = requests || [];

  // Compute balances from approved requests
  const approved = items.filter(r => r.status === 'approved');
  const pending = items.filter(r => r.status === 'pending');
  const usedVacation = approved.filter(r => r.request_type === 'vacation').reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const usedSick = approved.filter(r => r.request_type === 'sick').reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const usedPersonal = approved.filter(r => r.request_type === 'personal').reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const pendingHours = pending.reduce((s, r) => s + (Number(r.hours) || 0), 0);

  const balances = [
    { type: 'Vacation', total: 96, used: usedVacation, pending: pending.filter(r => r.request_type === 'vacation').reduce((s, r) => s + (Number(r.hours) || 0), 0) },
    { type: 'Sick Leave', total: 48, used: usedSick, pending: pending.filter(r => r.request_type === 'sick').reduce((s, r) => s + (Number(r.hours) || 0), 0) },
    { type: 'Personal', total: 16, used: usedPersonal, pending: pending.filter(r => r.request_type === 'personal').reduce((s, r) => s + (Number(r.hours) || 0), 0) },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-brand-green-100 text-brand-green-700 text-xs font-medium px-2 py-1 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3" />Pending</span>;
      case 'denied':
        return <span className="bg-brand-red-100 text-brand-red-700 text-xs font-medium px-2 py-1 rounded flex items-center gap-1"><XCircle className="w-3 h-3" />Denied</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs items={[{ label: 'Employee', href: '/employee' }, { label: 'Time Off' }]} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Off</h1>
            <p className="text-gray-600">View balances and request time off</p>
          </div>
          <Link
            href="/employee/time-off/request"
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Time Off
          </Link>
        </div>

        {/* Balances */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {balances.map(b => {
            const available = b.total - b.used - b.pending;
            const pct = b.total > 0 ? ((b.used + b.pending) / b.total) * 100 : 0;
            return (
              <div key={b.type} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-medium text-gray-500 text-sm mb-1">{b.type}</h3>
                <p className="text-3xl font-bold text-gray-900">{available}<span className="text-lg text-gray-400">h</span></p>
                <p className="text-sm text-gray-500 mt-1">of {b.total}h available</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-brand-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{b.used}h used</span>
                  {b.pending > 0 && <span>{b.pending}h pending</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Requests */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-900">Recent Requests</h2>
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No time off requests yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map(req => (
                <div key={req.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">{req.request_type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(req.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {req.start_date !== req.end_date && ` — ${new Date(req.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {req.hours}h
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
