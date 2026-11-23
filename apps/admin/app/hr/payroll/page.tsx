import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import PayrollClient from './PayrollClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/hr/payroll' },
  title: 'Payroll Management | Elevate For Humanity',
  description: 'Process and manage employee payroll.',
};

export default async function PayrollPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const [staffResult, runsResult, w9Result] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'instructor', 'staff']),
      supabase
        .from('payroll_runs')
        .select(
          'id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, employee_count, created_at',
        )
        .order('pay_date', { ascending: false })
        .limit(50),
      supabase
        .from('w9_submissions')
        .select('id, legal_name, ein, file_url, submitted_at, verified, provider_app_id', {
          count: 'exact',
        })
        .eq('verified', false)
        .order('submitted_at', { ascending: false })
        .limit(20),
    ]);

  return (
    <div className="min-h-screen bg-white">
      {(staffResult.error || runsResult.error || w9Result.error) && (
        <p role="alert" className="mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          Some payroll records could not be loaded. Refresh the page before relying on the totals.
        </p>
      )}
      <PayrollClient
        staffCount={staffResult.count ?? 0}
        payrollRuns={runsResult.data ?? []}
        w9Queue={w9Result.data ?? []}
        pendingW9Count={w9Result.count ?? 0}
      />
    </div>
  );
}
