import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookOpen, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
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

  const orgId = profile.organization_id;

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
  const { data: rtiProgress } = await supabase
    .from('lesson_progress')
    .select('user_id, lessons:lesson_id(count)')
    .in('user_id', enrollments?.map(e => e.user_id) || []);

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
      name: enrollment.profiles?.full_name || 'Unknown',
      email: enrollment.profiles?.email || '',
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

  // Get WOTC credits
  const { data: wotcCredits } = await supabase
    .from('wotc_credits')
    .select('*')
    .eq('host_shop_id', orgId)
    .in('status', ['pending', 'approved']);

  return {
    profile,
    apprentices,
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

  const { profile, apprentices, wotcCredits } = data;

  // Calculate stats
  const totalOJT = apprentices.reduce((sum, a) => sum + a.ojt_hours, 0);
  const totalRTI = apprentices.reduce((sum, a) => sum + a.rti_lessons, 0);
  const completedCount = apprentices.filter(a => a.completion_percentage >= 100).length;
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
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-blue-600">{apprentices.length}</p>
          <p className="text-sm text-slate-500">Active Apprentices</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-green-600">{totalOJT}</p>
          <p className="text-sm text-slate-500">Total OJT Hours</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-purple-600">{totalRTI}</p>
          <p className="text-sm text-slate-500">RTI Lessons Done</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-amber-600">${approvedWOTC.toLocaleString()}</p>
          <p className="text-sm text-slate-500">WOTC Credits Earned</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-emerald-600">{completedCount}</p>
          <p className="text-sm text-slate-500">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Apprentice Progress Table */}
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Apprentice Progress & Syllabus
            </h2>
            <a href="/admin/host-shop/apprentices" className="text-sm text-blue-600 hover:underline">
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Apprentice</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Program</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">OJT Progress</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">RTI Progress</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Overall</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">DOL Appendix A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apprentices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No apprentices assigned yet
                    </td>
                  </tr>
                ) : (
                  apprentices.map(apprentice => (
                    <tr key={apprentice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{apprentice.name}</p>
                        <p className="text-xs text-slate-400">{apprentice.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{apprentice.program}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (apprentice.ojt_hours / apprentice.ojt_required) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">
                            {apprentice.ojt_hours}/{apprentice.ojt_required} hrs
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (apprentice.rti_lessons / apprentice.rti_total) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">
                            {apprentice.rti_lessons}/{apprentice.rti_total} lessons
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-bold ${apprentice.completion_percentage >= 100 ? 'text-green-600' : 'text-slate-700'}`}>
                            {apprentice.completion_percentage}%
                          </span>
                          {apprentice.completion_percentage >= 100 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          apprentice.status === 'active' ? 'bg-green-100 text-green-700' :
                          apprentice.status === 'enrolled' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {apprentice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a 
                          href={apprentice.dol_appendix_a_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 inline-flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          Syllabus
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4">
          <a href="/admin/host-shop/ojt" className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 border border-blue-200">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-700">Log OJT Hours</p>
          </a>
          <a href="/admin/host-shop/apprentices" className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 border border-green-200">
            <BookOpen className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-700">View Apprentices</p>
          </a>
          <a href="/admin/host-shop/compliance" className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 border border-purple-200">
            <AlertCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-700">DOL Compliance</p>
          </a>
          <a href="/admin/host-shop/reports" className="p-4 bg-amber-50 rounded-xl text-center hover:bg-amber-100 border border-amber-200">
            <CheckCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="font-medium text-amber-700">Progress Reports</p>
          </a>
        </div>

        {/* DOL Competency Tracker */}
        <DOLCompetencyTracker 
          userId={user.id}
          organizationId={profile.organization_id}
          apprenticeshipProgram="barber"
        />
      </div>
    </div>
  );
}
