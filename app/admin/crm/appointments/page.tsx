import { requireRole } from '@/lib/auth/require-role';
import type { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Calendar, Plus, Clock, User, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Appointments | CRM | Admin | Elevate For Humanity',
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
};

export default async function AppointmentsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const [upcomingRes, pastRes, countRes] = await Promise.all([
    db
      .from('appointments')
      .select('id,title,contact_name,scheduled_at,status,notes')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(25),
    db
      .from('appointments')
      .select('id,title,contact_name,scheduled_at,status,notes')
      .lt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: false })
      .limit(25),
    db.from('appointments').select('*', { count: 'exact', head: true }),
  ]);

  const upcoming = upcomingRes.data ?? [];
  const past = pastRes.data ?? [];
  const total = countRes.count ?? 0;
  const completed = past.filter((a) => a.status === 'completed').length;
  const cancelled = [...upcoming, ...past].filter((a) => a.status === 'cancelled').length;

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
            <p className="text-slate-500 text-sm mt-1">Schedule and manage CRM appointments</p>
          </div>
          <Link
            href="/admin/crm/appointments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Appointment
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, icon: Calendar },
            { label: 'Upcoming', value: upcoming.length, icon: Clock },
            { label: 'Completed', value: completed, icon: CheckCircle },
            { label: 'Cancelled', value: cancelled, icon: XCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border p-4">
              <Icon className="w-5 h-5 text-slate-400 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
              No upcoming appointments.{' '}
              <Link href="/admin/crm/appointments/new" className="underline">
                Schedule one
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border divide-y">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{a.title || 'Appointment'}</p>
                    <p className="text-sm text-slate-500">{a.contact_name}</p>
                    {a.notes && <p className="text-sm text-slate-400 mt-1 truncate">{a.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700">{fmt(a.scheduled_at)}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Past Appointments</h2>
          {past.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-slate-400 text-sm">
              No past appointments.
            </div>
          ) : (
            <div className="bg-white rounded-xl border divide-y">
              {past.map((a) => (
                <div key={a.id} className="flex items-start gap-4 px-6 py-4 opacity-75">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700">{a.title || 'Appointment'}</p>
                    <p className="text-sm text-slate-400">{a.contact_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-slate-500">{fmt(a.scheduled_at)}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
