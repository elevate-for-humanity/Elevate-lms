import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { HoursApprovalQueue } from './HoursApprovalQueue';

export const metadata: Metadata = {
  title: 'Hours Approval | Employer Portal',
  description: 'Review and approve apprentice training hours.',
};

export const dynamic = 'force-dynamic';

export default async function EmployerHoursPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/employer/hours');

  // Verify employer role
  const { data: profile } = await db
    .from('user_profiles')
    .select('role, employer_id')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['employer', 'admin', 'sponsor'].includes(profile.role || '')) {
    redirect('/employer');
  }

  // Get stats from hour_entries
  const { count: pendingCount } = await db
    .from('hour_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedCount } = await db
    .from('hour_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: rejectedCount } = await db
    .from('hour_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  // Total approved hours
  const { data: approvedHoursData } = await db
    .from('hour_entries')
    .select('hours_claimed, accepted_hours')
    .eq('status', 'approved');

  const totalApprovedHours = (approvedHoursData || []).reduce(
    (sum, h) => sum + (Number(h.accepted_hours) || Number(h.hours_claimed) || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/employer-page-1.jpg" alt="Employer hours management" fill sizes="100vw" className="object-cover" priority />
      </section>

      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Employer', href: '/employer' },
            { label: 'Hours Approval' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hours Approval</h1>
          <p className="text-gray-600 mt-1">Review and approve apprentice training hours</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount || 0}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount || 0}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-brand-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount || 0}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalApprovedHours.toFixed(0)}</p>
                <p className="text-sm text-gray-500">Total Approved Hrs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Queue */}
        <HoursApprovalQueue />
      </div>
    </div>
  );
}
