import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Hours Management | Partner Portal',
  description: 'Review and approve apprentice hours.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerHoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/hours');
  }

  // Get partner info
  const { data: partnerUser } = await supabase
    .from('partner_users')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser) {
    redirect('/partner');
  }

  // Get hours statistics
  const { data: pendingHours, count: pendingCount } = await supabase
    .from('training_hours')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { count: approvedCount } = await supabase
    .from('training_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: rejectedCount } = await supabase
    .from('training_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  // Get total hours approved this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyHours } = await supabase
    .from('training_hours')
    .select('hours')
    .eq('status', 'approved')
    .gte('approved_at', startOfMonth.toISOString());

  const totalMonthlyHours = monthlyHours?.reduce((sum, h) => sum + (h.hours || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Partner', href: '/partner' },
            { label: 'Hours' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hours Management</h1>
            <p className="text-gray-600 mt-1">Review and approve apprentice training hours</p>
          </div>
          <Link
            href="/partner/hours/pending"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <AlertCircle className="w-4 h-4" />
            Review Pending ({pendingCount || 0})
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount || 0}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount || 0}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount || 0}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalMonthlyHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Hours This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/partner/hours/pending" className="block">
            <div className="bg-white rounded-xl border p-6 hover:border-orange-300 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Review Pending Hours</h3>
                  <p className="text-sm text-gray-600">Approve or reject submitted hours</p>
                </div>
              </div>
              {(pendingCount || 0) > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>{pendingCount}</strong> hours entries awaiting your review
                  </p>
                </div>
              )}
            </div>
          </Link>

          <Link href="/partner/attendance" className="block">
            <div className="bg-white rounded-xl border p-6 hover:border-brand-blue-300 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Record Attendance</h3>
                  <p className="text-sm text-gray-600">Log attendance for training sessions</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
