// Current operational counts are independent snapshots, not a cohort conversion funnel.
import Link from 'next/link';
import type { AdminDashboardData } from './types';

export function EnrollmentFunnel({ data }: {data: AdminDashboardData}) {
  const metric = (label: string) => data.kpis?.find(item => item.label === label);
  const count = (label: string) => {
    const item = metric(label);
    return item && item.unavailable !== true ? item.value.toLocaleString() : 'Unavailable';
  };
  const steps = [
    {label:'Pending applications', value:count('Pending Applications'), href:'/applications?status=submitted,pending,in_review,under_review,pending_admin_review,pending_funding'},
    {label:'Enrollment records', value:data.enrollmentSummary?.available ? data.enrollmentSummary.totalRecords.toLocaleString() : 'Unavailable', href:'/enrollments'},
    {label:'Active enrollments', value:count('Active Enrollments'), href:'/students?status=active'},
    {label:'Certificates issued', value:count('Certificates Issued'), href:'/certificates'},
  ];
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Enrollment snapshot">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <h2 className="text-sm font-bold text-slate-900">Enrollment snapshot</h2>
      <Link href="/analytics" className="text-xs font-semibold text-blue-700">Analytics →</Link>
    </div>
    <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
      {steps.map(step=><Link key={step.label} href={step.href} className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
        <span className="text-xl font-bold text-slate-950">{step.value}</span>
        <span className="mt-1 text-center text-xs text-slate-600">{step.label}</span>
      </Link>)}
    </div>
    <p className="px-4 pb-4 text-xs text-slate-600">Enrollment records exclude revoked and filtered test records. These counts have different populations; they do not establish cohort conversion rates.</p>
  </section>;
}
