import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import PayrollClient from './PayrollClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/payroll' },
  title: 'Payroll Management | Elevate For Humanity',
  description: 'Process and manage employee payroll.',
};

export default async function PayrollPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



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
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 px-6 py-5">
        <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
      </div>
      <PayrollClient staffCount={staffCount ?? 0} payrollRuns={payrollRuns ?? []} />
    </div>
  );
}
