'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Inbox, Users } from 'lucide-react';
import type { RecentApplication } from './types';
import { PENDING_APPLICATION_STATUS_QUERY } from '@/lib/admin/application-statuses';

export function LizzyOperationsPanel({
  pendingApplications,
  pendingCount,
  pendingProgramHolders,
  pendingEmployerHint,
}: {
  pendingApplications: RecentApplication[];
  pendingCount: number;
  pendingProgramHolders: number;
  pendingEmployerHint?: string;
}) {
  const applicationsHref = `/applications?status=${PENDING_APPLICATION_STATUS_QUERY}`;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">Operations — live intake</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Employer, program holder, and student applications from Supabase (no placeholder data).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b border-slate-100">
        <QueueCard
          label="Student applications"
          count={pendingCount}
          href={applicationsHref}
          Icon={Inbox}
          urgent={pendingCount > 0}
        />
        <QueueCard
          label="Program holders"
          count={pendingProgramHolders}
          href="/program-holders"
          Icon={Users}
          urgent={pendingProgramHolders > 0}
        />
        <QueueCard
          label="Employers"
          count={null}
          href="/employers/onboarding"
          Icon={Building2}
          detail={pendingEmployerHint ?? 'Review employer onboarding'}
        />
        <QueueCard
          label="Apprenticeship partners"
          count={null}
          href="/program-holders?type=apprenticeship"
          Icon={Briefcase}
          detail="Program holder / sponsor queue"
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-700">Pending student applications</span>
        <Link href={applicationsHref} className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          Open queue <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100">
        {pendingApplications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No applications awaiting review.</p>
        ) : (
          pendingApplications.map((app) => (
            <Link
              key={app.id}
              href={app.href}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {app.full_name || [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email || app.id.slice(0, 8)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {app.program_interest ?? 'Program TBD'} ·{' '}
                  <span className={app.status === 'pending_funding' ? 'text-amber-700 font-medium' : ''}>
                    {app.status}
                  </span>
                </p>
              </div>
              {app.urgent && (
                <span className="ml-2 shrink-0 text-[10px] font-bold uppercase text-rose-600">Urgent</span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function QueueCard({
  label,
  count,
  href,
  Icon,
  urgent,
  detail,
}: {
  label: string;
  count: number | null;
  href: string;
  Icon: typeof Inbox;
  urgent?: boolean;
  detail?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-3 hover:bg-slate-50 transition-colors ${
        urgent ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-semibold text-slate-800">{label}</span>
      </div>
      {count !== null ? (
        <p className={`text-2xl font-black tabular-nums ${urgent ? 'text-rose-600' : 'text-slate-900'}`}>{count}</p>
      ) : (
        <p className="text-xs text-slate-500">{detail}</p>
      )}
    </Link>
  );
}

// Default export for next/dynamic
export default LizzyOperationsPanel;
