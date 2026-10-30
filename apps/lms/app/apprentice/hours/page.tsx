import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Clock, Plus, Calendar, TrendingUp, Target } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { recordedHours, isOjlEntry } from '@/lib/apprenticeship/recorded-hours';
import { formatHoursDate } from '@/lib/apprenticeship/admin-hours-model';
import { getApprenticeshipRequiredHours } from '@/lib/compliance/apprenticeship';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import {
  APPRENTICE_TIMECLOCK_HISTORY_URL,
  APPRENTICE_TIMECLOCK_URL,
} from '@/lib/portal/apprenticeship-portal-paths';

export const metadata: Metadata = {
  title: 'Apprentice Hours',
  description: 'Track your apprenticeship hours and progress.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const showAll = (await searchParams).all === '1';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/hours');

  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  if (!programSlug) redirect('/apprentice');
  const hoursData = await readHoursPages<any>((from, to) =>
    db
      .from('hour_entries')
      .select(
        'id,work_date,hours_claimed,accepted_hours,notes,status,approval_status,source_type,category,created_at',
      )
      .eq('user_id', subject.userId)
      .eq('program_slug', programSlug)
      .order('work_date', { ascending: false })
      .order('id')
      .range(from, to),
  );

  const allLogs = hoursData || [];
  // Transfer credit is displayed from the verified enrollment fields below.
  // Historical transfer rows remain auditable but are excluded from weekly OJL.
  const workLogs = allLogs.filter((log: any) => isOjlEntry(log));
  const logs = showAll ? workLogs : workLogs.slice(0, 20);
  const totalHours = workLogs.reduce((sum, log: any) => sum + recordedHours(log), 0);
  const approvedHours = workLogs
    .filter((log: any) => ['approved', 'locked'].includes(log.status))
    .reduce((sum, log: any) => sum + recordedHours(log), 0);

  // Resolve required hours from the learner's active enrollment
  const { data: activeEnrollment, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('program_slug, transfer_hours, transfer_hours_verified')
    .or(`user_id.eq.${subject.userId},student_id.eq.${subject.userId}`)
    .eq('program_slug', programSlug)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) throw enrollmentError;

  const requiredHours = getApprenticeshipRequiredHours(activeEnrollment?.program_slug ?? null);
  const transferHoursVerified = activeEnrollment?.transfer_hours_verified === true;
  const transferHours = transferHoursVerified
    ? Math.max(0, Number(activeEnrollment?.transfer_hours) || 0)
    : 0;
  const creditedHours = approvedHours + transferHours;
  const progressPercent = requiredHours
    ? Math.min(Math.round((creditedHours / requiredHours) * 100), 100)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apprentice', href: '/apprentice' }, { label: 'Hours' }]} />
        </div>
      </div>

      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Apprentice Hours</h1>
            <p className="text-slate-700 mt-1">Track your apprenticeship progress</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={APPRENTICE_TIMECLOCK_URL}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm"
            >
              <Clock className="w-4 h-4" />
              Timeclock
            </Link>
            <Link
              href={APPRENTICE_TIMECLOCK_HISTORY_URL}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm"
            >
              Shift Log
            </Link>
            <Link
              href="/apprentice/competencies"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm"
            >
              Competency Log
            </Link>
            <Link
              href={APPRENTICE_TIMECLOCK_URL}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Clock In/Out
            </Link>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Apprenticeship Progress</h2>
            <span className="text-sm text-slate-700">
              {requiredHours
                ? `${creditedHours.toFixed(2)} / ${requiredHours} credited hours`
                : `${creditedHours.toFixed(2)} credited hours`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
            <div
              className="bg-brand-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-700">
            {requiredHours
              ? `${progressPercent}% complete`
              : 'Program hour target not configured yet'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(2)}</p>
                <p className="text-sm text-slate-700">Total Logged</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{approvedHours.toFixed(2)}</p>
                <p className="text-sm text-slate-700">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {transferHoursVerified ? transferHours.toFixed(2) : 'Pending'}
                </p>
                <p className="text-sm text-slate-700">Transfer Hours</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {requiredHours ? Math.max(requiredHours - creditedHours, 0).toFixed(2) : 'N/A'}
                </p>
                <p className="text-sm text-slate-700">Remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hours List */}
        {logs.length > 0 ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-white">
              <h2 className="font-semibold text-slate-900">
                {showAll ? 'All Entries' : 'Recent Entries'}
              </h2>
            </div>
            <div className="divide-y">
              {logs.map((log: any) => (
                <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{formatHoursDate(log.work_date)}</p>
                    <p className="text-sm text-slate-700">
                      {log.notes || log.source_type?.toUpperCase() || 'Apprenticeship work'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-900">
                      {recordedHours(log).toFixed(2)} hrs
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ['approved', 'locked'].includes(log.status)
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : log.status === 'rejected' || log.approval_status === 'rejected'
                            ? 'bg-brand-red-100 text-brand-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {log.approval_status || log.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t bg-white">
              <Link
                href={showAll ? '/apprentice/hours' : '/apprentice/hours?all=1'}
                className="text-brand-blue-600 hover:underline text-sm"
              >
                {showAll ? 'Show recent entries →' : 'View all entries →'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Clock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No hours logged yet</h2>
            <p className="text-slate-700 mb-6">Start tracking your apprenticeship hours.</p>
            <Link
              href={APPRENTICE_TIMECLOCK_URL}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Plus className="w-4 h-4" />
              Clock In/Out
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
