import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Clock, Calendar, CheckCircle, TrendingUp, Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Hours History | Apprentice Portal | Elevate For Humanity',
  description: 'Track your apprenticeship hours.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function HoursHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/hours/history');
  }

  // Fetch apprenticeship enrollment
  const { data: enrollment } = await supabase
    .from('apprenticeship_enrollments')
    .select(`
      id,
      status,
      start_date,
      target_hours,
      apprenticeship:apprenticeships(id, title, employer:employers(name))
    `)
    .eq('apprentice_id', user.id)
    .eq('status', 'active')
    .single();

  // Fetch hours log
  const { data: hoursLog } = await supabase
    .from('apprentice_hours')
    .select('*')
    .eq('enrollment_id', enrollment?.id)
    .order('date', { ascending: false })
    .limit(50);

  // Calculate totals
  const totalHours = hoursLog?.reduce((sum, h) => sum + (h.hours || 0), 0) || 0;
  const approvedHours = hoursLog?.filter(h => h.status === 'approved').reduce((sum, h) => sum + (h.hours || 0), 0) || 0;
  const pendingHours = hoursLog?.filter(h => h.status === 'pending').reduce((sum, h) => sum + (h.hours || 0), 0) || 0;
  const targetHours = enrollment?.target_hours || 2000;
  const progressPercent = Math.round((approvedHours / targetHours) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Breadcrumbs
        items={[
          { label: 'Apprentice Portal', href: '/apprentice' },
          { label: 'Hours', href: '/apprentice/hours' },
          { label: 'History' },
        ]}
      />
      <div className="max-w-5xl mx-auto px-4">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hours Tracking</h1>
            {enrollment && (
              <p className="text-gray-600">
                {enrollment.apprenticeship?.title} at {enrollment.apprenticeship?.employer?.name}
              </p>
            )}
          </div>
          <Link href="/apprentice/hours/log"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Log Hours
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Clock className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalHours}</p>
            <p className="text-gray-600 text-sm">Total Hours Logged</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{approvedHours}</p>
            <p className="text-gray-600 text-sm">Approved Hours</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{progressPercent}%</p>
            <p className="text-gray-600 text-sm">Progress to Goal</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Calendar className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{targetHours - approvedHours}</p>
            <p className="text-gray-600 text-sm">Hours Remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Progress to {targetHours} hours</span>
            <span className="text-gray-600">{approvedHours} / {targetHours}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-orange-500 h-4 rounded-full transition-all" 
              style={{ width: `${Math.min(100, progressPercent)}%` }} />
          </div>
          {pendingHours > 0 && (
            <p className="text-sm text-yellow-600 mt-2">
              {pendingHours} hours pending approval
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Hours Log</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Supervisor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hoursLog && hoursLog.length > 0 ? (
                hoursLog.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.hours}h</td>
                    <td className="px-4 py-3 text-sm">{entry.type || 'On-the-job'}</td>
                    <td className="px-4 py-3 text-sm">{entry.supervisor_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                        entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">No hours logged yet</p>
                    <p className="text-sm text-gray-500 mb-4">Start logging your apprenticeship hours</p>
                    <Link href="/apprentice/hours/log"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> Log Hours
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
