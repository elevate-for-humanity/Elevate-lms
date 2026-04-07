import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import JobRetryButton from './JobRetryButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Background Jobs | Admin | Elevate For Humanity',
};

interface JobRow {
  id: string;
  type: string;
  status: string;
  attempts: number;
  created_at: string;
  processed_at: string | null;
  run_after: string;
  last_error: string | null;
  payload: Record<string, unknown>;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700',
  processing: 'bg-brand-blue-50 text-brand-blue-700',
  completed:  'bg-green-50 text-green-700',
  failed:     'bg-red-50 text-red-700',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default async function SystemJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(\'/login\');

  const db = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) {
    redirect('/unauthorized');
  }

  const { data: pendingJobs } = await supabase
    .from('job_queue')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: failedJobs } = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: recentCompleted } = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'completed')
    .order('processed_at', { ascending: false })
    .limit(20);

  const pending = (pendingJobs ?? []) as JobRow[];
  const failed  = (failedJobs  ?? []) as JobRow[];
  const recent  = (recentCompleted ?? []) as JobRow[];

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'System', href: '/admin/system' },
    { label: 'Background Jobs', href: '/admin/system/jobs' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Background Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Certificate emails, notifications, and other async side effects.
            Processed by <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/api/jobs/process</code>.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {pending.length} pending
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {failed.length} failed
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            {recent.length} recent
          </span>
        </div>
      </div>

      {/* Failed jobs */}
      {failed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Failed — require attention
          </h2>
          <div className="border border-red-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-red-50 text-red-800">
                <tr>
                  {['Type', 'Certificate', 'Attempts', 'Created', 'Error', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 bg-white">
                {failed.map((job) => (
                  <tr key={job.id} className="hover:bg-red-50/40">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{job.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {(job.payload?.certificateId as string | undefined)?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{job.attempts}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(job.created_at)}</td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate" title={job.last_error ?? ''}>
                      {job.last_error ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <JobRetryButton jobId={job.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pending / processing */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Pending &amp; Processing
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No pending jobs.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {['Type', 'Status', 'Certificate', 'Attempts', 'Run after', 'Created'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pending.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{job.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[job.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {(job.payload?.certificateId as string | undefined)?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{job.attempts}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(job.run_after)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(job.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recently completed */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" /> Recently Completed
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No completed jobs yet.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {['Type', 'Certificate', 'Attempts', 'Completed'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recent.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{job.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {(job.payload?.certificateId as string | undefined)?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{job.attempts}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(job.processed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
