import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AlertTriangle, Clock, CheckCircle, XCircle, Calendar, RefreshCw } from 'lucide-react';
import ExamAuthWorkQueue from './ExamAuthWorkQueue';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Exam Authorization Queue | Admin',
  robots: { index: false, follow: false },
};

export default async function ExamAuthorizationsPage() {
  const supabase = await createClient();
  const db = createAdminClient() ?? supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/exam-authorizations');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
    redirect('/unauthorized');
  }

  // Work queue — active + recently terminal authorizations
  const { data: queue } = await supabase
    .from('exam_authorization_queue')
    .select('*');

  const rows = queue ?? [];

  // Summary counts for the header strip
  const counts = {
    needs_scheduling:     rows.filter(r => r.action_needed === 'needs_scheduling').length,
    awaiting_outcome:     rows.filter(r => r.action_needed === 'awaiting_outcome').length,
    needs_result:         rows.filter(r => r.action_needed === 'needs_result_recorded').length,
    eligible_for_reauth:  rows.filter(r => r.action_needed === 'eligible_for_reauth').length,
    expiring_soon:        rows.filter(r => r.expiring_soon).length,
    // Stuck: authorized > 5 days with no scheduled date
    stuck: rows.filter(r =>
      r.action_needed === 'needs_scheduling' &&
      r.authorized_at &&
      (Date.now() - new Date(r.authorized_at).getTime()) > 5 * 24 * 60 * 60 * 1000
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Exam Authorization Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rolling individual bookings — SLA: schedule within 5 days of authorization.
          </p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SummaryCard
            label="Needs Scheduling"
            count={counts.needs_scheduling}
            icon={<Calendar className="w-4 h-4" />}
            color="blue"
          />
          <SummaryCard
            label="Stuck > 5 Days"
            count={counts.stuck}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={counts.stuck > 0 ? 'red' : 'gray'}
          />
          <SummaryCard
            label="Awaiting Outcome"
            count={counts.awaiting_outcome}
            icon={<Clock className="w-4 h-4" />}
            color="yellow"
          />
          <SummaryCard
            label="Needs Result"
            count={counts.needs_result}
            icon={<CheckCircle className="w-4 h-4" />}
            color="green"
          />
          <SummaryCard
            label="Expiring Soon"
            count={counts.expiring_soon}
            icon={<XCircle className="w-4 h-4" />}
            color={counts.expiring_soon > 0 ? 'orange' : 'gray'}
          />
          <SummaryCard
            label="Eligible Re-auth"
            count={counts.eligible_for_reauth}
            icon={<RefreshCw className="w-4 h-4" />}
            color="purple"
          />
        </div>

        {/* Work queue table */}
        <ExamAuthWorkQueue rows={rows} currentUserId={user.id} />
      </div>
    </div>
  );
}

function SummaryCard({
  label, count, icon, color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'yellow' | 'green' | 'orange' | 'purple' | 'gray';
}) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray:   'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
  );
}
