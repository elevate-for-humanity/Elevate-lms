import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import PayrollClient from './PayrollClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/payroll' },
  title: 'Payroll Management | Elevate For Humanity',
  description: 'Process and manage employee payroll.',
};

export default async function PayrollPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { count: staffCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['admin', 'super_admin', 'instructor', 'staff']);

  const { data: payrollRuns } = await supabase
    .from('payroll_runs')
    .select('id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, employee_count, created_at')
    .order('pay_date', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 px-6 py-5">
        <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
      </div>
      <PayrollClient staffCount={staffCount ?? 0} payrollRuns={payrollRuns ?? []} />
    </div>
  );
}
