import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Apprenticeship Host Shop Dashboard - Elevate',
  description: 'Manage your apprenticeship host shop, apprentices, and OJT tracking',
};

export const dynamic = 'force-dynamic';

async function getHostShopData(userId: string) {
  const supabase = await createClient();
  
  // Get profile to verify host shop role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'host_shop') {
    return null;
  }

  // Get apprentices at this host shop
  const { data: apprentices } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (full_name, email),
      programs (title, slug)
    `)
    .eq('host_shop_id', profile.organization_id)
    .in('status', ['active', 'enrolled', 'paused']);

  // Get recent OJT hours
  const { data: ojtHours } = await supabase
    .from('ojt_hours')
    .select('*, profiles:user_id(full_name)')
    .eq('host_shop_id', profile.organization_id)
    .order('date', { ascending: false })
    .limit(50);

  // Get pending WOTC
  const { data: wotcCredits } = await supabase
    .from('wotc_credits')
    .select('*')
    .eq('host_shop_id', profile.organization_id)
    .in('status', ['pending', 'approved']);

  return {
    profile,
    apprentices: apprentices || [],
    ojtHours: ojtHours || [],
    wotcCredits: wotcCredits || [],
  };
}

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/host-shop/dashboard');
  }

  const data = await getHostShopData(user.id);

  if (!data) {
    redirect('/unauthorized');
  }

  const { profile, apprentices, ojtHours, wotcCredits } = data;

  // Calculate stats
  const totalHours = ojtHours.reduce((sum, h) => sum + (h.hours || 0), 0);
  const thisMonth = ojtHours
    .filter(h => new Date(h.date).getMonth() === new Date().getMonth())
    .reduce((sum, h) => sum + (h.hours || 0), 0);
  const pendingWOTC = wotcCredits.filter(w => w.status === 'pending').length;
  const approvedWOTC = wotcCredits.filter(w => w.status === 'approved').reduce((sum, w) => sum + (w.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Apprenticeship Host Shop Dashboard</h1>
        <p className="text-slate-500">{profile.organizations?.name || 'Your Host Shop'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-blue-600">{apprentices.length}</p>
          <p className="text-sm text-slate-500">Active Apprentices</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-green-600">{totalHours}</p>
          <p className="text-sm text-slate-500">Total OJT Hours</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-amber-600">{thisMonth}</p>
          <p className="text-sm text-slate-500">Hours This Month</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-purple-600">${approvedWOTC.toLocaleString()}</p>
          <p className="text-sm text-slate-500">WOTC Credits Earned</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Apprentices */}
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Your Apprentices</h2>
            <a href="/admin/host-shop/apprentices" className="text-sm text-blue-600 hover:underline">
              View All
            </a>
          </div>
          <div className="divide-y">
            {apprentices.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                No apprentices assigned yet
              </div>
            ) : (
              apprentices.slice(0, 5).map(apprentice => (
                <div key={apprentice.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {apprentice.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {apprentice.programs?.title || 'Apprenticeship'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    apprentice.status === 'active' ? 'bg-green-100 text-green-700' :
                    apprentice.status === 'enrolled' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {apprentice.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent OJT */}
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Recent OJT Hours</h2>
            <a href="/admin/host-shop/ojt" className="text-sm text-blue-600 hover:underline">
              Log Hours
            </a>
          </div>
          <div className="divide-y">
            {ojtHours.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                No OJT hours logged yet
              </div>
            ) : (
              ojtHours.slice(0, 5).map(entry => (
                <div key={entry.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {entry.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold text-green-600">
                    +{entry.hours} hrs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WOTC Credits */}
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">WOTC Tax Credits</h2>
            <span className="text-sm text-amber-600">{pendingWOTC} pending</span>
          </div>
          <div className="p-4">
            {wotcCredits.length === 0 ? (
              <p className="text-center text-slate-500">No WOTC credits yet</p>
            ) : (
              <div className="space-y-3">
                {wotcCredits.slice(0, 4).map(credit => (
                  <div key={credit.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{credit.employee_name}</p>
                      <p className="text-xs text-slate-500">{credit.status}</p>
                    </div>
                    <p className="font-semibold text-green-600">
                      ${credit.amount?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <a href="/admin/host-shop/ojt" className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100">
              <p className="font-medium text-blue-700">Log OJT Hours</p>
            </a>
            <a href="/admin/host-shop/apprentices" className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100">
              <p className="font-medium text-green-700">View Apprentices</p>
            </a>
            <a href="/admin/host-shop/compliance" className="p-3 bg-purple-50 rounded-lg text-center hover:bg-purple-100">
              <p className="font-medium text-purple-700">Compliance</p>
            </a>
            <a href="/admin/host-shop/reports" className="p-3 bg-amber-50 rounded-lg text-center hover:bg-amber-100">
              <p className="font-medium text-amber-700">Reports</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}