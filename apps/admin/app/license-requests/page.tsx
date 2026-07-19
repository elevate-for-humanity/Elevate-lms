import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, Clock, CheckCircle, XCircle, Key } from 'lucide-react';
import LicenseRequestsClient from './LicenseRequestsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'License Requests | Admin | Elevate For Humanity' };

export default async function LicenseRequestsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const [
    { count: pending },
    { count: approved },
    { count: total },
    { data: requests },
  ] = await Promise.all([
    db.from('license_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('license_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('license_requests').select('*', { count: 'exact', head: true }),
    db.from('license_requests')
      .select('id, license_type, status, requested_at, approved_at, created_at, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const stats = [
    { label: 'Pending', value: pending ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: approved ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total', value: total ?? 0, icon: Key, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/licenses" className="hover:text-slate-700">Licenses</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Requests</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">License Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Pending license upgrade and access requests from users</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <LicenseRequestsClient initialRequests={requests ?? []} />
    </div>
  );
}
