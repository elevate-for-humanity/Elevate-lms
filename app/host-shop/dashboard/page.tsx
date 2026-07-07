/**
 * Host Shop Dashboard - Full Implementation
 * 
 * This is the MAIN dashboard for ALL host shop types:
 * - Barber Host Shops
 * - Cosmetology Host Shops
 * - Nail Tech Host Shops
 * - Esthetician Host Shops
 * 
 * Shows: Shop info, apprentices, hours, competencies, schedule, documents, reports
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHostShopBoard } from '@/lib/partner/board';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  Building2,
  Award
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Host Shop Dashboard | Elevate for Humanity',
  description: 'Manage your host shop, apprentices, and training programs.',
};

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/host-shop/dashboard');
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
    
  if (!profile || !['partner', 'admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Get host shop board data
  const board = await getHostShopBoard(user.id);

  // Get shop type for display
  const shopType = board.tradeInfo?.label || 'Host Shop';
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {board.partner?.name || board.shops[0]?.name || 'Host Shop Dashboard'}
              </h1>
              <p className="text-slate-600 mt-1">
                {shopType} · {board.shops[0]?.city && `${board.shops[0].city}, `}{board.shops[0]?.state || 'Indiana'}
              </p>
            </div>
            <div className="flex gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                board.partner?.mou_signed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                MOU {board.partner?.mou_signed ? 'Signed' : 'Pending'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                board.partner?.approval_status === 'approved' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {board.partner?.approval_status === 'approved' ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Users className="w-5 h-5" />}
            value={board.apprentices.length}
            label="Active Apprentices"
            color="blue"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5" />}
            value={board.hoursSummary?.totalHours || 0}
            label="Total RTI Hours"
            color="green"
          />
          <StatCard 
            icon={<CheckCircle className="w-5 h-5" />}
            value={board.competenciesSummary?.completed || 0}
            label="Competencies Signed"
            color="purple"
          />
          <StatCard 
            icon={<FileText className="w-5 h-5" />}
            value={board.documentsSummary?.verified || 0}
            label="Documents Verified"
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Apprentices Card */}
          <div className="md:col-span-2 bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Apprentices</h2>
              <Link 
                href="/host-shop/dashboard/apprentices" 
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            </div>
            {board.apprentices.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active apprentices yet</p>
                <p className="text-sm mt-1">Accept apprentices to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {board.apprentices.slice(0, 5).map((apprentice) => (
                  <div key={apprentice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">
                          {apprentice.full_name?.charAt(0) || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{apprentice.full_name}</p>
                        <p className="text-sm text-slate-500">Program: {apprentice.program_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{apprentice.hours_logged || 0} hrs</p>
                      <p className="text-xs text-slate-500">{apprentice.competencies_signed || 0} signed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href="/host-shop/dashboard/hours"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
              >
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-slate-700">Log RTI Hours</span>
              </Link>
              <Link 
                href="/host-shop/dashboard/competencies"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
              >
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-slate-700">Sign Competencies</span>
              </Link>
              <Link 
                href="/host-shop/dashboard/schedule"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
              >
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-slate-700">View Schedule</span>
              </Link>
              <Link 
                href="/host-shop/dashboard/documents"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
              >
                <FileText className="w-5 h-5 text-orange-600" />
                <span className="text-slate-700">Manage Documents</span>
              </Link>
              <Link 
                href="/host-shop/dashboard/reports"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
              >
                <TrendingUp className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">View Reports</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(!board.partner?.mou_signed || board.alerts.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Action Required</h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {!board.partner?.mou_signed && (
                    <li>• Sign the MOU to complete onboarding</li>
                  )}
                  {board.alerts.map((alert, i) => (
                    <li key={i}>• {alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
