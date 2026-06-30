export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Handshake,
  Users,
  Briefcase,
  UserCircle,
  ArrowRight,
  Shield,
  Clock,
  Settings,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import HeroPicture from '@/components/marketing/HeroPicture';
import { hero as heroTokens, layout, type as textType, btn } from '@/lib/page-design-tokens';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/portals',
  },
  robots: { index: false, follow: false },
  title: 'Portals',
  description:
    'Sign in to your Elevate portal — learner, apprentice, employer, partner, instructor, case manager, mentor, or staff.',
  keywords: [
    'student portal',
    'employer portal',
    'partner portal',
    'apprentice portal',
    'staff portal',
    'dashboard',
    'login',
  ],
};

type PortalEntry = {
  icon: typeof GraduationCap;
  title: string;
  description: string;
  href: string;
  features: string[];
};

const portals: PortalEntry[] = [
  {
    icon: GraduationCap,
    title: 'Learner Portal',
    description:
      'Courses, progress, grades, schedule, and career services for enrolled students.',
    href: '/login?redirect=/learner/dashboard',
    features: ['My programs', 'Progress', 'Career services'],
  },
  {
    icon: Clock,
    title: 'Apprentice Portal',
    description: 'OJT hours, competencies, timeclock, handbook, and board exam prep.',
    href: '/login/apprentice',
    features: ['Hour tracking', 'Competencies', 'Timeclock'],
  },
  {
    icon: Briefcase,
    title: 'Employer Portal',
    description: 'Jobs, apprentices, training progress, and compliance documents.',
    href: '/login?redirect=/employer/dashboard',
    features: ['Hiring', 'Apprentices', 'Compliance'],
  },
  {
    icon: Handshake,
    title: 'Partner Portal',
    description: 'Attendance, apprentice hours, MOUs, and program reporting for host sites.',
    href: '/login?redirect=/partner/dashboard',
    features: ['Attendance', 'Hours', 'MOU docs'],
  },
  {
    icon: Building2,
    title: 'Program Holder Portal',
    description: 'Program management, enrollments, compliance, and outcomes.',
    href: '/login?redirect=/program-holder/dashboard',
    features: ['Programs', 'Enrollments', 'Reports'],
  },
  {
    icon: Users,
    title: 'Instructor Portal',
    description: 'Roster, lab and assignment review, grades, and course tools.',
    href: '/login?redirect=/instructor/dashboard',
    features: ['Roster', 'Submissions', 'Grades'],
  },
  {
    icon: UserCircle,
    title: 'Case Manager Portal',
    description: 'Caseload, WIOA verification, placements, and compliance reporting.',
    href: '/login?redirect=/case-manager/dashboard',
    features: ['Caseload', 'Placements', 'WIOA'],
  },
  {
    icon: Users,
    title: 'Mentor Portal',
    description: 'Mentees, sessions, progress notes, and mentoring resources.',
    href: '/login?redirect=/mentor/dashboard',
    features: ['Mentees', 'Sessions', 'Resources'],
  },
  {
    icon: Briefcase,
    title: 'Staff Portal',
    description: 'Daily operations — students, attendance, at-risk flags, and reports.',
    href: '/login?redirect=/admin/staff-portal/dashboard',
    features: ['Students', 'Attendance', 'Reports'],
  },
  {
    icon: Settings,
    title: 'Admin Dashboard',
    description: 'Full platform administration — students, programs, compliance, and analytics.',
    href: '/login?redirect=/admin/dashboard',
    features: ['Students', 'Programs', 'Analytics'],
  },
];

export default async function PortalsPage() {
  // Public portal chooser — same on desktop and mobile. Signed-in users pick
  // their workspace; no auto-redirect to a role dashboard or barber portal.

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Portals' }]} />

      <HeroPicture
        src="/images/pages/workforce-training.webp"
        alt="Workforce training at Elevate for Humanity"
        microLabel="Your dashboard"
        heightStyle={heroTokens.imageWrap}
        belowHeroHeadline="Choose your portal"
        belowHeroSubheadline={`Sign in to the right workspace for your role at ${PLATFORM_DEFAULTS.orgName}. Each portal is scoped to your permissions and program access.`}
        ctas={[
          { label: 'Sign in', href: '/login', variant: 'primary' },
          { label: 'Contact support', href: '/contact', variant: 'secondary' },
        ]}
        trustIndicators={['Secure sign-in', 'Role-based access', 'Available 24/7']}
      />

      <section className={`${layout.section} border-b border-slate-100`}>
        <div className={layout.container}>
          <p className={textType.eyebrow}>Portals</p>
          <h2 className={`${textType.h2} mt-2 mb-8`}>Select your workspace</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.title}
                  href={portal.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-red-200 hover:shadow-md transition-all"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue-700">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                    {portal.title}
                  </h3>
                  <p className={`${textType.bodySmall} mt-2 flex-1`}>{portal.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                    {portal.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-red-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600">
                    Open portal
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-16">
        <div className={`${layout.containerNarrow} text-center`}>
          <h2 className={textType.h2}>Not sure which portal?</h2>
          <p className={`${textType.body} mt-3`}>
            Learners and apprentices use different sign-in paths. Employers and training partners
            each have dedicated dashboards. Our team can point you to the right link.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className={btn.primary}>
              Contact support
            </Link>
            <Link href="/faq" className={btn.secondary}>
              View FAQ
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-12 text-white">
        <div className={layout.container}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Already have an account?</h2>
              <p className="mt-2 text-slate-300 text-sm max-w-xl">
                Use the same email you enrolled with. You will be taken to your role dashboard after
                sign-in.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-green-400" aria-hidden />
                  Encrypted session
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-blue-400" aria-hidden />
                  24/7 access
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/login?redirect=/learner/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-red-700 transition-colors"
              >
                <GraduationCap className="h-5 w-5" aria-hidden />
                Learner sign in
              </Link>
              <Link
                href="/login?redirect=/employer/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                <Building2 className="h-5 w-5" aria-hidden />
                Employer sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Other roles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
