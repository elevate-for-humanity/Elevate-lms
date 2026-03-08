import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import PayrollClient from './PayrollClient';

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

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { count: staffCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['admin', 'super_admin', 'instructor', 'staff']);

  const { data: payrollRuns } = await db
    .from('payroll_runs')
    .select('id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, employee_count, created_at')
    .order('pay_date', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative h-[160px] sm:h-[200px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Payroll management" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/50" />
        <div className="absolute inset-0 flex items-end pb-6 px-6">
          <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
        </div>
      </section>
      <PayrollClient staffCount={staffCount ?? 0} payrollRuns={payrollRuns ?? []} />
    </div>
  );
}
