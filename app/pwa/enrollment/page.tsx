import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

async function getEnrollmentData() {
  const supabase = createAdminClient();
  if (!supabase) return { applications: [], programs: [], enrollments: [] };

  const [appRes, programRes, enrollRes] = await Promise.all([
    supabase.from('student_applications').select('id, full_name, email, phone, status, state, created_at, data').order('created_at', { ascending: false }).limit(20),
    supabase.from('programs').select('id, name, slug, category, total_cost, is_active, funding_eligible, is_free').eq('is_active', true).order('category, name').limit(30),
    supabase.from('enrollments').select('id, user_id, course_id, status, progress, enrolled_at').order('enrolled_at', { ascending: false }).limit(20),
  ]);

  return {
    applications: appRes.data || [],
    programs: programRes.data || [],
    enrollments: enrollRes.data || [],
  };
}

export default async function EnrollmentPWAPage() {
  const { applications, programs, enrollments } = await getEnrollmentData();

  const pendingApps = applications.filter((a: any) => a.status === 'pending' || a.status === 'new' || !a.status);
  const approvedApps = applications.filter((a: any) => a.status === 'approved');
  const freePrograms = programs.filter((p: any) => p.is_free || p.funding_eligible);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image src="/images/pages/demo-page-3.jpg" alt="Student enrollment" fill className="object-cover" priority />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Enrollment Center</h1>
          <p className="text-brand-orange-200 text-sm mt-1">Apply, track status, and complete enrollment</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-orange-500">{applications.length}</div>
          <div className="text-xs text-slate-500">Applications</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingApps.length}</div>
          <div className="text-xs text-slate-500">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-green-600">{enrollments.length}</div>
          <div className="text-xs text-slate-500">Enrolled</div>
        </div>
      </div>

      {/* Apply CTA */}
      <div className="px-4 mt-6">
        <Link href="/start" className="block bg-brand-orange-500 text-white rounded-xl p-5 text-center hover:bg-brand-orange-600 transition-colors">
          <div className="text-lg font-bold">Start Your Application →</div>
          <div className="text-brand-orange-100 text-sm mt-1">{freePrograms.length} programs with funding available</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/wioa-eligibility" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-white">
            Check Eligibility
          </Link>
          <Link href="/funding" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-white">
            Funding Options
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Recent Applications ({applications.length})</h2>
        <div className="space-y-2">
          {applications.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-slate-500 text-sm">No applications yet.</p>
              <Link href="/start" className="text-brand-orange-600 font-semibold text-sm mt-2 inline-block">Apply Now →</Link>
            </div>
          )}
          {applications.slice(0, 8).map((app: any) => (
            <div key={app.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                app.status === 'approved' ? 'bg-brand-green-500' :
                app.status === 'pending' || !app.status ? 'bg-amber-500' :
                app.status === 'enrolled' ? 'bg-brand-blue-500' :
                'bg-slate-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{app.full_name}</div>
                <div className="text-xs text-slate-500">{app.email} · {new Date(app.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                app.status === 'approved' ? 'bg-brand-green-100 text-brand-green-700' :
                app.status === 'enrolled' ? 'bg-brand-blue-100 text-brand-blue-700' :
                app.status === 'pending' || !app.status ? 'bg-amber-100 text-amber-700' :
                'bg-white text-slate-600'
              }`}>
                {app.status || 'new'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollment Steps */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">How Enrollment Works</h2>
        <div className="space-y-2">
          {[
            { step: '1', title: 'Apply Online', desc: 'Submit your application with program preference' },
            { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for WIOA/JRI' },
            { step: '3', title: 'Get Approved', desc: 'Receive acceptance and enrollment instructions' },
            { step: '4', title: 'Start Training', desc: 'Begin your program and track progress in the LMS' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3">
              <div className="w-8 h-8 bg-brand-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{s.title}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Programs */}
      <div className="px-4 mt-6 pb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Available Programs ({programs.length})</h2>
        <div className="space-y-2">
          {programs.slice(0, 10).map((prog: any) => (
            <Link key={prog.id} href={`/programs/${prog.slug}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-brand-orange-300">
              <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center text-brand-orange-600 font-bold text-xs flex-shrink-0">
                {prog.category?.slice(0, 3).toUpperCase() || 'PRG'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{prog.name}</div>
                <div className="text-xs text-slate-500">
                  {prog.category}
                  {prog.is_free ? ' · Free' : prog.total_cost ? ` · $${prog.total_cost}` : ''}
                  {prog.funding_eligible ? ' · Funding available' : ''}
                </div>
              </div>
              <span className="text-slate-500 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
