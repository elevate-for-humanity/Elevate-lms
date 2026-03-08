import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users, ClipboardList, BarChart2, Calendar, FileText,
  DollarSign, BookOpen, Star, Settings, ChevronRight,
  CheckCircle, AlertCircle, Video
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Staff Portal | Elevate For Humanity',
  description: 'Manage students, track enrollments, and access administrative tools.',
};

export default async function StaffPortalLanding() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch completion state if logged in
  let payrollDone = false;
  let handbookDone = false;
  let skillsCount = 0;
  let profile: any = null;

  if (user) {
    const [{ data: pp }, { data: ha }, { data: us }, { data: pr }] = await Promise.all([
      db.from('payroll_profiles').select('id').eq('user_id', user.id).maybeSingle(),
      db.from('handbook_acknowledgments').select('id').eq('user_id', user.id).maybeSingle(),
      db.from('user_skills').select('skill_name').eq('user_id', user.id),
      db.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    ]);
    payrollDone = !!pp;
    handbookDone = !!ha;
    skillsCount = (us ?? []).length;
    profile = pr;
  }

  const quickLinks = [
    { label: 'Students', href: '/admin/students', icon: Users, desc: 'Manage enrollments' },
    { label: 'Attendance', href: '/admin/attendance', icon: ClipboardList, desc: 'Record & export' },
    { label: 'Reports', href: '/admin/reports', icon: BarChart2, desc: 'Progress & outcomes' },
    { label: 'Scheduling', href: '/admin/scheduling', icon: Calendar, desc: 'Classes & sessions' },
    { label: 'Documents', href: '/employee/documents', icon: FileText, desc: 'Forms & uploads' },
    { label: 'My Payroll', href: '/employee/payroll', icon: DollarSign, desc: 'Pay stubs & W-2' },
    { label: 'Handbook', href: '/employee/handbook', icon: BookOpen, desc: 'Policies & procedures' },
    { label: 'My Skills', href: '/staff-portal/skills', icon: Star, desc: 'Track competencies' },
    { label: 'Interviews', href: '/careers', icon: Video, desc: 'Hiring pipeline' },
    { label: 'Settings', href: '/staff-portal/settings', icon: Settings, desc: 'Preferences' },
  ];

  const onboardingItems = [
    { label: 'Orientation Video', href: '/onboarding/staff/orientation', done: !!user },
    { label: 'Employee Handbook', href: '/employee/handbook', done: handbookDone },
    { label: 'Payroll & W-9 Setup', href: '/onboarding/payroll-setup', done: payrollDone },
    { label: 'Skills Assessment', href: '/staff-portal/skills', done: skillsCount >= 5 },
  ];
  const onboardingComplete = onboardingItems.filter(i => i.done).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[220px] sm:h-[260px]">
        <Image src="/images/pages/staff-portal-page-1.jpg" alt="Staff Portal" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex flex-col justify-end pb-8 px-6 max-w-6xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-white mb-1">
            {user && profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Staff Portal'}
          </h1>
          <p className="text-slate-300 text-sm">Elevate for Humanity · Staff &amp; Instructor Tools</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Onboarding progress (only if logged in and not complete) */}
        {user && onboardingComplete < onboardingItems.length && (
          <div className="bg-white rounded-xl border mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Complete Your Onboarding</h2>
                <p className="text-xs text-slate-400">{onboardingComplete}/{onboardingItems.length} steps done</p>
              </div>
              <Link href="/onboarding/staff"
                className="text-sm text-brand-blue-600 hover:underline font-medium flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y">
              {onboardingItems.map(item => (
                <Link key={item.label} href={item.href}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition">
                  {item.done
                    ? <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0" />
                    : <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                  <span className={`text-sm font-medium flex-1 ${item.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {item.label}
                  </span>
                  {!item.done && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick links grid */}
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {quickLinks.map(({ label, href, icon: Icon, desc }) => (
            <Link key={href} href={href}
              className="bg-white rounded-xl border p-4 flex flex-col items-center text-center hover:border-brand-blue-300 hover:bg-brand-blue-50 transition group">
              <div className="w-10 h-10 bg-slate-100 group-hover:bg-brand-blue-100 rounded-xl flex items-center justify-center mb-2 transition">
                <Icon className="w-5 h-5 text-slate-500 group-hover:text-brand-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-blue-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Not logged in CTA */}
        {!user && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In to Access Staff Tools</h2>
            <p className="text-slate-500 mb-6">Your dashboard, payroll, handbook, and student management tools are available after signing in.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login?redirect=/staff-portal"
                className="px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-xl hover:bg-brand-blue-700">
                Sign In
              </Link>
              <Link href="/onboarding/staff"
                className="px-6 py-3 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200">
                New Staff Onboarding
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
