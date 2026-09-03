import { Metadata } from 'next';
import { blurDataURL } from '@/lib/ui/blur-placeholder';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Users,
  ClipboardList,
  BarChart2,
  Calendar,
  DollarSign,
  BookOpen,
  Star,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  BriefcaseBusiness,
  GraduationCap,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Staff Portal',
  description: 'Manage students, track enrollments, and access administrative tools.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://admin.elevateforhumanity.org/staff-portal' },
};

const MARKETING_URL = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;

export default async function StaffPortalLanding() {
  const { user } = await requireStaffPortalAccess();
  const supabase = await createClient();

  let payrollDone = false;
  let handbookDone = false;
  let skillsCount = 0;
  let profile: { full_name?: string | null; role?: string | null } | null = null;

  if (user) {
    const [{ data: pp }, { data: ha }, { data: us }, { data: pr }] = await Promise.all([
      supabase.from('payroll_profiles').select('id').eq('user_id', user.id).maybeSingle(),
      supabase.from('handbook_acknowledgments').select('id').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_skills').select('skill_name').eq('user_id', user.id),
      supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    ]);
    payrollDone = !!pp;
    handbookDone = !!ha;
    skillsCount = (us ?? []).length;
    profile = pr;
  }

  const quickLinks = [
    { label: 'Students', href: '/staff-portal/students', icon: Users, desc: 'Manage enrollments' },
    { label: 'Attendance', href: '/staff-portal/attendance', icon: ClipboardList, desc: 'Record & export' },
    { label: 'Reports', href: '/staff-portal/reports', icon: BarChart2, desc: 'Progress & outcomes' },
    { label: 'Scheduling', href: '/crm/appointments', icon: Calendar, desc: 'Appointments & sessions' },
    { label: 'My Payroll', href: '/hr/payroll', icon: DollarSign, desc: 'Payroll administration' },
    { label: 'Handbook', href: `${MARKETING_URL}/handbook`, icon: BookOpen, desc: 'Policies & procedures' },
    { label: 'My Skills', href: '/staff-portal/skills', icon: Star, desc: 'Track competencies' },
    { label: 'Cases', href: '/staff-portal/cases', icon: BriefcaseBusiness, desc: 'Assigned cases' },
    { label: 'Training', href: '/staff-portal/training', icon: GraduationCap, desc: 'Staff development' },
    { label: 'Settings', href: '/staff-portal/settings', icon: Settings, desc: 'Preferences' },
  ];

  const onboardingItems = [
    { label: 'Staff Orientation', href: `${MARKETING_URL}/onboarding/staff`, done: !!user },
    { label: 'Employee Handbook', href: `${MARKETING_URL}/handbook`, done: handbookDone },
    { label: 'Payroll & W-9 Setup', href: `${MARKETING_URL}/onboarding/payroll-setup`, done: payrollDone },
    { label: 'Skills Assessment', href: '/staff-portal/skills', done: skillsCount >= 5 },
  ];
  const onboardingComplete = onboardingItems.filter((item) => item.done).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal' }]} />
        </div>
      </div>

      <section className="relative h-[220px] sm:h-[260px]">
        <Image
          placeholder="blur"
          blurDataURL={blurDataURL}
          src="/images/pages/admin/staff-portal-page-1.webp"
          alt="Staff Portal"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 mx-auto flex w-full max-w-6xl flex-col justify-end px-6 pb-8">
          <h1 className="mb-1 text-3xl font-bold text-slate-900">
            {user && profile?.full_name
              ? `Welcome, ${profile.full_name.split(' ')[0]}`
              : 'Staff Portal'}
          </h1>
          <p className="text-sm text-slate-600">
            {PLATFORM_DEFAULTS.orgName} · Staff &amp; Instructor Tools
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {user && onboardingComplete < onboardingItems.length && (
          <div className="mb-8 overflow-hidden rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-900">Complete Your Onboarding</h2>
                <p className="text-xs text-slate-500">
                  {onboardingComplete}/{onboardingItems.length} steps done
                </p>
              </div>
              <Link
                href={`${MARKETING_URL}/onboarding/staff`}
                className="flex items-center gap-1 text-sm font-medium text-brand-blue-600 hover:underline"
              >
                View onboarding <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y">
              {onboardingItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-slate-50"
                >
                  {item.done ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-brand-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  )}
                  <span
                    className={`flex-1 text-sm font-medium ${item.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}
                  >
                    {item.label}
                  </span>
                  {!item.done && <ChevronRight className="h-4 w-4 text-slate-400" />}
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Quick Access</h2>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {quickLinks.map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center rounded-xl border bg-white p-4 text-center transition hover:border-brand-blue-300 hover:bg-brand-blue-50"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition group-hover:bg-brand-blue-100">
                <Icon className="h-5 w-5 text-slate-600 group-hover:text-brand-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-blue-700">{label}</p>
              <p className="mt-0.5 text-xs text-slate-600">{desc}</p>
            </Link>
          ))}
        </div>

        {!user && (
          <div className="rounded-xl border bg-white p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-slate-900">Sign In to Access Staff Tools</h2>
            <p className="mb-6 text-slate-600">
              Your dashboard, payroll, handbook, and student management tools are available after signing in.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login?redirect=/staff-portal"
                className="rounded-xl bg-brand-blue-600 px-6 py-3 font-bold text-white hover:bg-brand-blue-700"
              >
                Sign In
              </Link>
              <Link
                href={`${MARKETING_URL}/onboarding/staff`}
                className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-900 hover:bg-slate-200"
              >
                New Staff Onboarding
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
