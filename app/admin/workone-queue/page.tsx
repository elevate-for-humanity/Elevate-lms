import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Clock, CheckCircle, AlertTriangle, Phone, Mail, ExternalLink } from 'lucide-react';
import WorkOneApproveButton from './WorkOneApproveButton';

export const metadata: Metadata = {
  title: 'WorkOne Queue | Admin | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WorkOneQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/workone-queue');

  const db = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Load pending_workone and funding_review applications
  const { data: apps } = await supabase
    .from('applications')
    .select(`
      id, first_name, last_name, email, phone,
      program_interest, status, created_at,
      requested_funding_source, recommended_funding_source,
      household_size, annual_income_usd,
      has_workone_approval, workone_approval_ref,
      eligibility_status, eligibility_data
    `)
    .in('status', ['pending_workone', 'funding_review'])
    .order('created_at', { ascending: true });

  const pending = apps ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b px-6 py-3">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'WorkOne Queue' },
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">WorkOne / Funding Queue</h1>
            <p className="text-sm text-slate-500 mt-1">
              Applications held pending WorkOne eligibility confirmation.
              Set <strong>has_workone_approval = true</strong> once the student returns with their authorization.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            {pending.length} pending
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No applications pending WorkOne confirmation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(app => {
              const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || 'Unknown';
              const daysPending = Math.floor(
                (Date.now() - new Date(app.created_at).getTime()) / 86400000,
              );
              const isUrgent = daysPending >= 20; // 30-day hold — flag at 20

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-xl border p-5 ${isUrgent ? 'border-red-200' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Name + urgency */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-900">{name}</span>
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            <AlertTriangle className="w-3 h-3" /> {daysPending} days — expires soon
                          </span>
                        )}
                        {!isUrgent && (
                          <span className="text-xs text-slate-400">{daysPending} days pending</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          app.status === 'pending_workone'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {app.status === 'pending_workone' ? 'Pending WorkOne' : 'Funding Review'}
                        </span>
                      </div>

                      {/* Contact */}
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                        {app.email && (
                          <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-brand-blue-600">
                            <Mail className="w-3.5 h-3.5" /> {app.email}
                          </a>
                        )}
                        {app.phone && (
                          <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-brand-blue-600">
                            <Phone className="w-3.5 h-3.5" /> {app.phone}
                          </a>
                        )}
                      </div>

                      {/* Funding details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Program</span>
                          <span className="font-medium text-slate-700">{app.program_interest || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Requested funding</span>
                          <span className="font-medium text-slate-700">{app.requested_funding_source || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Household size</span>
                          <span className="font-medium text-slate-700">{app.household_size ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Annual income</span>
                          <span className="font-medium text-slate-700">
                            {app.annual_income_usd ? `$${app.annual_income_usd.toLocaleString()}` : '—'}
                          </span>
                        </div>
                      </div>

                      {app.workone_approval_ref && (
                        <p className="mt-2 text-xs text-emerald-700 font-medium">
                          WorkOne ref: {app.workone_approval_ref}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
                      >
                        View application <ExternalLink className="w-3 h-3" />
                      </Link>
                      <WorkOneApproveButton
                        applicationId={app.id}
                        studentName={name}
                        hasApproval={app.has_workone_approval ?? false}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
