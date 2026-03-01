import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Clock, Plus, Calendar, TrendingUp, Target } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Apprentice Hours | Elevate For Humanity',
  description: 'Track your apprenticeship hours and progress.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeHoursPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/apprentice/hours');

  // Fetch hours from consolidated hour_entries table
  const { data: hoursData, error } = await db
    .from('hour_entries')
    .select(`
      id,
      work_date,
      hours_claimed,
      accepted_hours,
      notes,
      status,
      source_type,
      category,
      created_at
    `)
    .eq('user_id', user.id)
    .order('work_date', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching hours:', error.message);
  }

  const logs = hoursData || [];
  const totalHours = logs.reduce((sum, log: any) => sum + (log.hours_claimed || 0), 0);
  const approvedHours = logs
    .filter((log: any) => log.status === 'approved')
    .reduce((sum, log: any) => sum + (log.accepted_hours || log.hours_claimed || 0), 0);
  
  // Apprenticeship typically requires specific hours
  const requiredHours = 2000;
  const progressPercent = Math.min(Math.round((approvedHours / requiredHours) * 100), 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apprentice', href: '/apprentice' }, { label: 'Hours' }]} />
        </div>
      </div>

      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apprentice Hours</h1>
            <p className="text-gray-600 mt-1">Track your apprenticeship progress</p>
          </div>
          <Link
            href="/apprentice/hours/log"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <Plus className="w-4 h-4" />
            Log Hours
          </Link>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Apprenticeship Progress</h2>
            <span className="text-sm text-gray-500">{approvedHours} / {requiredHours} hours</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-brand-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progressPercent}% complete</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
                <p className="text-sm text-gray-500">Total Logged</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedHours}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                <p className="text-sm text-gray-500">Entries</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{requiredHours - approvedHours}</p>
                <p className="text-sm text-gray-500">Remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hours List */}
        {logs.length > 0 ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Recent Entries</h2>
            </div>
            <div className="divide-y">
              {logs.map((log: any) => (
                <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(log.work_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-500">{log.notes || log.source_type?.toUpperCase() || 'Apprenticeship work'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">{log.hours_claimed} hrs</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'approved' 
                        ? 'bg-brand-green-100 text-brand-green-700'
                        : log.status === 'rejected'
                        ? 'bg-brand-red-100 text-brand-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50">
              <Link href="/apprentice/hours/history" className="text-brand-blue-600 hover:underline text-sm">
                View all entries →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hours logged yet</h2>
            <p className="text-gray-600 mb-6">Start tracking your apprenticeship hours.</p>
            <Link 
              href="/apprentice/hours/log"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Plus className="w-4 h-4" />
              Log Your First Hours
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
