import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Video, FileText, Users, Monitor, DollarSign,
  BookOpen, CheckCircle, Clock, Lock, ChevronRight, Star
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Staff Onboarding | Elevate For Humanity',
  description: 'Complete your staff onboarding process.',
  robots: { index: false, follow: false },
};

export default async function StaffOnboardingPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/staff');

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  // Check completion state of each step
  const [
    { data: payrollProfile },
    { data: handbookAck },
    { data: userSkills },
  ] = await Promise.all([
    db.from('payroll_profiles').select('id, status').eq('user_id', user.id).maybeSingle(),
    db.from('handbook_acknowledgments').select('id').eq('user_id', user.id).maybeSingle(),
    db.from('user_skills').select('skill_name').eq('user_id', user.id),
  ]);

  const skillsCompleted = (userSkills ?? []).length;
  const payrollDone = !!payrollProfile;
  const handbookDone = !!handbookAck;
  // Orientation video: mark done if they've been here before (simple flag via profile)
  const orientationDone = profile?.role != null; // everyone with a role has been oriented

  const steps = [
    {
      id: 'orientation',
      icon: Video,
      title: 'Welcome & Orientation Video',
      desc: 'Watch the welcome message from Elizabeth Greene and learn about our mission.',
      href: '/onboarding/staff/orientation',
      done: orientationDone,
      required: true,
    },
    {
      id: 'handbook',
      icon: BookOpen,
      title: 'Employee Handbook',
      desc: 'Read and acknowledge all policies, procedures, and your rights as an employee.',
      href: '/employee/handbook',
      done: handbookDone,
      required: true,
    },
    {
      id: 'payroll',
      icon: DollarSign,
      title: 'Payroll & W-9 Setup',
      desc: 'Choose your pay method (direct deposit, pay card, or check) and submit your W-9.',
      href: '/onboarding/payroll-setup',
      done: payrollDone,
      required: true,
    },
    {
      id: 'skills',
      icon: Star,
      title: 'Skills Self-Assessment',
      desc: `Complete your skills checklist to identify training needs. ${skillsCompleted > 0 ? `${skillsCompleted} skills marked.` : 'Not started.'}`,
      href: '/staff-portal/skills',
      done: skillsCompleted >= 5,
      required: false,
    },
    {
      id: 'team',
      icon: Users,
      title: 'Meet the Team',
      desc: 'Review team member profiles and understand how departments work together.',
      href: '/about/team',
      done: false,
      required: false,
    },
    {
      id: 'platform',
      icon: Monitor,
      title: 'Platform Training',
      desc: 'Learn to navigate the LMS, staff portal, and student management tools.',
      href: '/staff-portal/training',
      done: false,
      required: false,
    },
    {
      id: 'ferpa',
      icon: FileText,
      title: 'FERPA Compliance Training',
      desc: 'Complete required FERPA training to handle student records lawfully.',
      href: '/admin/ferpa/training',
      done: false,
      required: true,
    },
  ];

  const requiredSteps = steps.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => s.done).length;
  const allRequiredDone = completedRequired === requiredSteps.length;
  const pct = Math.round((completedRequired / requiredSteps.length) * 100);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }, { label: 'Staff' }]} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-10">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-1">Welcome to Elevate, {firstName}!</h1>
          <p className="text-slate-400 text-sm mb-6">Complete the steps below to finish your onboarding. Required steps must be done before your first day.</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-700 rounded-full h-2.5">
              <div className="bg-brand-green-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-brand-green-400 whitespace-nowrap">
              {completedRequired}/{requiredSteps.length} required
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {allRequiredDone && (
          <div className="mb-6 flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 text-brand-green-800 rounded-xl px-5 py-4">
            <CheckCircle className="w-6 h-6 flex-shrink-0 text-brand-green-600" />
            <div>
              <p className="font-bold">All required steps complete!</p>
              <p className="text-sm text-brand-green-700">You're ready for your first day. HR will confirm your start details by email.</p>
            </div>
          </div>
        )}

        {/* Required steps */}
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Required</h2>
        <div className="bg-white rounded-xl border divide-y mb-6">
          {steps.filter(s => s.required).map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>

        {/* Optional steps */}
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Recommended</h2>
        <div className="bg-white rounded-xl border divide-y mb-8">
          {steps.filter(s => !s.required).map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>

        {/* Help */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Need help?</h3>
          <p className="text-slate-600 text-sm mb-3">Contact HR if you have questions about any onboarding step.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="mailto:hr@elevateforhumanity.org"
              className="text-sm text-brand-blue-600 hover:underline font-medium">
              hr@elevateforhumanity.org
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="tel:+13173143757" className="text-sm text-brand-blue-600 hover:underline font-medium">
              (317) 314-3757
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: any }) {
  const Icon = step.icon;
  return (
    <Link href={step.href}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        step.done ? 'bg-brand-green-100' : 'bg-slate-100 group-hover:bg-brand-blue-100'
      }`}>
        {step.done
          ? <CheckCircle className="w-5 h-5 text-brand-green-600" />
          : <Icon className="w-5 h-5 text-slate-500 group-hover:text-brand-blue-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {step.title}
          </p>
          {step.done && (
            <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded-full font-medium">Done</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{step.desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 flex-shrink-0" />
    </Link>
  );
}
