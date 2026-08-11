import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Award, Briefcase, Calendar, Clock, Mail, MapPin, Phone, User } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import PayRateEditor from './PayRateEditor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Employee Details | HR | Admin' };

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin']);
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*,profiles(id,first_name,last_name,email,phone,avatar_url),departments(id,name),managers:employees!employees_manager_id_fkey(profiles(first_name,last_name))')
    .eq('id', id)
    .maybeSingle();
  if (error || !employee) notFound();

  const [timeOffResult, reviewsResult, payrollResult, historyResult] = await Promise.all([
    supabase.from('time_off_requests').select('*').eq('user_id', employee.user_id).order('created_at', { ascending: false }).limit(5),
    supabase.from('performance_reviews').select('*').eq('employee_id', id).order('review_date', { ascending: false }).limit(3),
    supabase.from('payroll_profiles').select('rate,payment_type,payout_method,payroll_provider,tax_id_uploaded').eq('user_id', employee.user_id ?? '').maybeSingle(),
    supabase.from('pay_rate_history').select('rate,payment_type,effective_date,notes,created_at').eq('employee_id', id).order('created_at', { ascending: false }).limit(10),
  ]);

  const profile = Array.isArray(employee.profiles) ? employee.profiles[0] : employee.profiles;
  const department = Array.isArray(employee.departments) ? employee.departments[0] : employee.departments;
  const managerEmployee = Array.isArray(employee.managers) ? employee.managers[0] : employee.managers;
  const managerProfile = Array.isArray(managerEmployee?.profiles) ? managerEmployee?.profiles[0] : managerEmployee?.profiles;
  const timeOffRequests = timeOffResult.data ?? [];
  const reviews = reviewsResult.data ?? [];
  const payrollProfile = payrollResult.data;
  const payRateHistory = historyResult.error ? [] : historyResult.data ?? [];
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Employee';

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <Link href="/hr/employees" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />Back to employees</Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 text-white">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/15">
              {profile?.avatar_url ? <Image src={profile.avatar_url} alt={displayName} fill sizes="80px" className="object-cover" /> : <User className="absolute inset-0 m-auto h-9 w-9" />}
            </div>
            <div><p className="text-xs font-black uppercase tracking-widest text-blue-100">Employee record</p><h1 className="mt-1 text-3xl font-black">{displayName}</h1><p className="text-blue-100">{employee.job_title || 'Employee'}{department?.name ? ` · ${department.name}` : ''}</p></div>
            <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase">{String(employee.status || 'active').replaceAll('_', ' ')}</span>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="space-y-6">
            <section className="rounded-2xl bg-slate-50 p-5">
              <h2 className="font-black text-slate-950">Employment details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  [Briefcase, 'Job title', employee.job_title || 'Not recorded'],
                  [Calendar, 'Start date', employee.start_date ? new Date(employee.start_date).toLocaleDateString() : 'Not recorded'],
                  [Clock, 'Employment type', employee.employment_type || 'Not recorded'],
                  [User, 'Reports to', managerProfile ? [managerProfile.first_name, managerProfile.last_name].filter(Boolean).join(' ') : 'Not assigned'],
                  [MapPin, 'Work location', employee.work_location || 'Not recorded'],
                ].map(([Icon, label, value]) => { const ItemIcon = Icon as typeof User; return <div key={String(label)} className="rounded-xl bg-white p-4"><ItemIcon className="h-4 w-4 text-brand-blue-700" /><p className="mt-2 text-xs font-bold uppercase text-slate-500">{String(label)}</p><p className="mt-1 font-bold text-slate-900">{String(value)}</p></div>; })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Time off requests</h2>
              <div className="mt-4 space-y-3">{timeOffRequests.length ? timeOffRequests.map((request: any) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-bold text-slate-900">{request.type || 'Time off'}</p><p className="text-xs text-slate-600">{request.start_date ? new Date(request.start_date).toLocaleDateString() : '—'} – {request.end_date ? new Date(request.end_date).toLocaleDateString() : '—'}</p></div><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700">{request.status || 'pending'}</span></div>) : <p className="text-sm text-slate-500">No time off requests.</p>}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Performance reviews</h2>
              <div className="mt-4 space-y-3">{reviews.length ? reviews.map((review: any) => <div key={review.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-3"><Award className="h-5 w-5 text-amber-600" /><div><p className="font-bold text-slate-900">{review.review_period || 'Performance review'}</p><p className="text-xs text-slate-600">{review.review_date ? new Date(review.review_date).toLocaleDateString() : '—'}</p></div></div><span className="font-black text-slate-950">{review.rating ?? '—'}/5</span></div>) : <p className="text-sm text-slate-500">No performance reviews.</p>}</div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Contact</h2>
              <div className="mt-4 space-y-3 text-sm"><p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" />{profile?.email || 'No email recorded'}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" />{profile?.phone || 'No phone recorded'}</p></div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-black text-slate-950">Compensation</h2>
              <PayRateEditor
                employeeId={id}
                currentRate={payrollProfile?.rate ?? employee.hourly_rate ?? employee.salary ?? null}
                paymentType={payrollProfile?.payment_type ?? employee.employment_type ?? null}
                payoutMethod={payrollProfile?.payout_method ?? null}
                payrollProvider={payrollProfile?.payroll_provider ?? null}
                w9OnFile={payrollProfile?.tax_id_uploaded ?? false}
                history={payRateHistory as any[]}
              />
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
