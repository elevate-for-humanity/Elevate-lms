import { Metadata } from 'next';
import { createClient, safeGetUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Building2, 
  MapPin,
  Calendar,
  BarChart3,
  DollarSign,
  Shield,
  MessageSquare,
  ChevronRight,
  User,
  Star
} from 'lucide-react';
import { DOLCompetencyTracker } from '@/components/dashboard/DOLCompetencyTracker';

export const metadata: Metadata = {
  title: 'Apprenticeship Host Shop Dashboard - Elevate',
  description: 'Manage your apprenticeship host shop, apprentices, and OJT tracking',
};

export const dynamic = 'force-dynamic';

interface ApprenticeProgress {
  id: string;
  name: string;
  email: string;
  program: string;
  program_slug: string;
  ojt_hours: number;
  ojt_required: number;
  rti_lessons: number;
  rti_total: number;
  completion_percentage: number;
  last_activity: string;
  status: string;
  dol_appendix_a_url?: string;
  user_id: string;
  enrollment_id: string;
}

// Stat card component
function StatCard({ icon: Icon, label, value, trend, trendValue, color, href }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:border-brand-blue-200 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-7 h-7" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Action card component
function ActionCard({ icon: Icon, title, description, href, color, badge }: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-brand-blue-200 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

async function getHostShopData(userId: string) {
  const supabase = await createClient();
  
  // Get profile to verify host shop role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', userId)
    .single();

  if (!profile || !['host_shop', 'admin', 'super_admin'].includes(profile.role)) {
    return null;
  }

  const orgId = profile.organization_id;
  if (!orgId) {
    // If admin but no org, they might be viewing a specific shop, but for now just return empty
    if (['admin', 'super_admin'].includes(profile.role)) {
      return { profile, apprentices: [], wotcCredits: [] };
    }
    return null;
  }

  // Get apprentices with their progress
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (full_name, email),
      programs (id, title, slug, ojt_hours_required, rti_hours_required)
    `)
    .eq('host_shop_id', orgId)
    .in('status', ['active', 'enrolled', 'paused']);

  // Get OJT hours per apprentice
  const { data: ojtData } = await supabase
    .from('ojt_hours')
    .select('user_id, hours')
    .eq('host_shop_id', orgId);

  // Calculate progress for each apprentice
  const ojtByUser: Record<string, number> = {};
  ojtData?.forEach(h => {
    ojtByUser[h.user_id] = (ojtByUser[h.user_id] || 0) + h.hours;
  });

  // Get RTI progress (lessons completed)
  const apprenticeUserIds = enrollments?.map(e => e.user_id).filter(Boolean) as string[] || [];
  const { data: rtiProgress } = apprenticeUserIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('user_id')
        .in('user_id', apprenticeUserIds)
        .eq('completed', true)
    : { data: [], error: null };

  const rtiByUser: Record<string, number> = {};
  rtiProgress?.forEach(p => {
    rtiByUser[p.user_id] = (rtiByUser[p.user_id] || 0) + 1;
  });

  const apprentices: ApprenticeProgress[] = (enrollments || []).map(enrollment => {
    const ojtHours = ojtByUser[enrollment.user_id] || 0;
    const rtiCompleted = rtiByUser[enrollment.user_id] || 0;
    const rtiTotal = enrollment.programs?.rti_hours_required || 500;
    const ojtRequired = enrollment.programs?.ojt_hours_required || 2000;
    
    const ojtPct = Math.min(100, (ojtHours / ojtRequired) * 100);
    const rtiPct = Math.min(100, (rtiCompleted / rtiTotal) * 100);
    const completionPct = Math.round((ojtPct + rtiPct) / 2);

    return {
      id: enrollment.id,
      name: enrollment.profiles?.full_name || enrollment.full_name || 'Unknown',
      email: enrollment.profiles?.email || enrollment.email || '',
      program: enrollment.programs?.title || 'Apprenticeship',
      program_slug: enrollment.programs?.slug || '',
      ojt_hours: ojtHours,
      ojt_required: ojtRequired,
      rti_lessons: rtiCompleted,
      rti_total: rtiTotal,
      completion_percentage: completionPct,
      last_activity: enrollment.updated_at || enrollment.created_at,
      status: enrollment.status,
      dol_appendix_a_url: `/programs/${enrollment.programs?.slug}/syllabus`,
      user_id: enrollment.user_id,
      enrollment_id: enrollment.id,
    };
  });

  // Get WOTC credits (safe check as table might be missing)
  let wotcCredits: any[] = [];
  try {
    const { data } = await supabase
      .from('wotc_credits')
      .select('*')
      .eq('host_shop_id', orgId)
      .in('status', ['pending', 'approved']);
    wotcCredits = data || [];
  } catch (e) {
    console.warn('wotc_credits table query failed - likely missing');
  }

  return {
    profile,
    apprentices,
    wotcCredits,
  };
}

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const user = safeGetUser(await supabase.auth.getUser());

  if (!user) {
    redirect('/login');
  }

  const data = await getHostShopData(user.id);

  if (!data) {
    redirect('/unauthorized');
  }

  const { profile, apprentices, wotcCredits } = data;

  // Safety check: if no apprentices are assigned yet, show a clean empty state rather than crashing on empty data
  const hasApprentices = apprentices && apprentices.length > 0;

  const totalOJT = hasApprentices ? apprentices.reduce((sum, a) => sum + a.ojt_hours, 0) : 0;
  const totalRTI = hasApprentices ? apprentices.reduce((sum, a) => sum + a.rti_lessons, 0) : 0;
  const completedCount = hasApprentices ? apprentices.filter(a => a.completion_percentage >= 100).length : 0;
  const approvedWOTC = wotcCredits ? wotcCredits.filter((w: any) => w.status === 'approved').reduce((sum: number, w: any) => sum + (w.amount || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-[1600px] mx-auto">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-600 to-indigo-700 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{profile.organizations?.name || 'Host Shop Dashboard'}</h1>
                  <p className="text-white/80 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.organizations?.address || 'Indianapolis, IN'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Good Standing
                </span>
                <span className="text-sm text-white/80">
                  <strong>{apprentices.length}</strong> Active Apprentices
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/admin/host-shop/apprentices" className="bg-white text-brand-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition shadow-lg flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Manage Apprentices
              </Link>
              <Link href="/admin/host-shop/ojt" className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                Log OJT Hours
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard 
          icon={Users} 
          label="Active Apprentices" 
          value={apprentices.length} 
          color="bg-blue-100 text-blue-600" 
          href="/admin/host-shop/apprentices" 
        />
        <StatCard 
          icon={Clock} 
          label="Total OJT Hours" 
          value={totalOJT} 
          color="bg-green-100 text-green-600" 
          href="/admin/host-shop/ojt" 
        />
        <StatCard 
          icon={BookOpen} 
          label="RTI Lessons Done" 
          value={totalRTI} 
          color="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          icon={DollarSign} 
          label="WOTC Credits" 
          value={`$${approvedWOTC.toLocaleString()}`} 
          color="bg-amber-100 text-amber-600" 
        />
        <StatCard 
          icon={CheckCircle} 
          label="Completed" 
          value={completedCount} 
          color="bg-emerald-100 text-emerald-600" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - Apprentice Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue-600" />
                Apprentice Progress
              </h2>
              <Link href="/admin/host-shop/apprentices" className="text-sm text-brand-blue-600 font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Apprentice</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apprentices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p>No apprentices assigned yet</p>
                        <p className="text-xs mt-1">Contact your administrator to link apprentices to your shop.</p>
                      </td>
                    </tr>
                  ) : (
                    apprentices.map(apprentice => (
                      <tr key={apprentice.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-brand-blue-700 font-bold text-sm">
                                {apprentice.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{apprentice.name}</p>
                              <p className="text-xs text-slate-500">{apprentice.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700">{apprentice.program}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[100px]">
                              <div 
                                className="bg-brand-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${apprentice.completion_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{apprentice.completion_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            apprentice.status === 'active' ? 'bg-green-100 text-green-700' :
                            apprentice.status === 'enrolled' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {apprentice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={apprentice.dol_appendix_a_url || '#'}
                            className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold text-sm inline-flex items-center gap-1"
                          >
                            Details <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionCard icon={Clock} title="Review Hours" description="Approve logs" href="/admin/host-shop/ojt" color="bg-amber-100 text-amber-600" />
            <ActionCard icon={CheckCircle} title="Sign Off" description="Competencies" href="/admin/host-shop/compliance" color="bg-green-100 text-green-600" />
            <ActionCard icon={MessageSquare} title="Messages" description="Contact team" href="/admin/inbox" color="bg-blue-100 text-blue-600" />
            <ActionCard icon={BarChart3} title="Reports" description="Export data" href="/admin/host-shop/reports" color="bg-purple-100 text-purple-600" />
          </div>
        </div>

        {/* Sidebar - DOL Tracker & Info */}
        <div className="space-y-6">
        {/* DOL Competency Tracker */}
        {hasApprentices ? (
          <DOLCompetencyTracker 
            programSlug={apprentices[0].program_slug || 'barber'}
            userId={user.id}
            isHostShop={true}
            enrollmentId={apprentices[0].id}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
             <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance Tracker Ready</h3>
             <p className="text-slate-500 max-w-md mx-auto">
               Once apprentices are linked to your shop, you can track their DOL competencies and sign off on their progress here.
             </p>
          </div>
        )}

          {/* Compliance Status */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-green-900">Shop Compliance</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Status</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
              </div>
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-green-700">Next Audit: Scheduled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
