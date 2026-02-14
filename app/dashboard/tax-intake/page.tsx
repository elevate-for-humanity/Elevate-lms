import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText, Users, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tax Intake | Dashboard | Elevate For Humanity',
  description: 'Manage VITA tax intake appointments.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TaxIntakePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/tax-intake');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['staff', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch tax intake records
  const { data: intakes } = await supabase
    .from('tax_intake')
    .select(`
      id,
      status,
      appointment_date,
      appointment_time,
      created_at,
      client:profiles!tax_intake_client_id_fkey(id, full_name, email, phone),
      preparer:profiles!tax_intake_preparer_id_fkey(full_name)
    `)
    .order('appointment_date', { ascending: true })
    .limit(50);

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const { count: todayCount } = await supabase
    .from('tax_intake')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_date', today);

  const { count: pendingCount } = await supabase
    .from('tax_intake')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: completedCount } = await supabase
    .from('tax_intake')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: totalCount } = await supabase
    .from('tax_intake')
    .select('*', { count: 'exact', head: true });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/admin" className="hover:text-orange-600">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Tax Intake</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VITA Tax Intake</h1>
            <p className="text-gray-600">Manage tax preparation appointments</p>
          </div>
          <Link href="/tax"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Schedule Appointment
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Clock className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{todayCount || 0}</p>
            <p className="text-gray-600 text-sm">Today's Appointments</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{pendingCount || 0}</p>
            <p className="text-gray-600 text-sm">Pending</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{completedCount || 0}</p>
            <p className="text-gray-600 text-sm">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalCount || 0}</p>
            <p className="text-gray-600 text-sm">Total Clients</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <select className="px-3 py-2 border rounded-lg">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="date" className="px-3 py-2 border rounded-lg" />
          </div>
        </div>

        {/* Intake Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Appointment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Preparer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {intakes && intakes.length > 0 ? (
                intakes.map((intake: any) => (
                  <tr key={intake.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-medium">{intake.client?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{intake.client?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {intake.appointment_date ? new Date(intake.appointment_date).toLocaleDateString() : 'Not scheduled'}
                      </p>
                      <p className="text-sm text-gray-500">{intake.appointment_time || ''}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {intake.preparer?.full_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(intake.status)}`}>
                        {intake.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/tax-intake/${intake.id}`}
                        className="text-orange-600 hover:text-orange-700 text-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">No intake records</p>
                    <p className="text-sm text-gray-500">Tax intake appointments will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
