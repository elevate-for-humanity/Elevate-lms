import { Metadata } from 'next';
import Link from 'next/link';
import { PortalRouter, PORTAL_META, type PortalKey } from '@/lib/routing/portal-router';
import {
  GraduationCap, Shield, Handshake, Briefcase, Users,
  Building2, Crown, ClipboardList, UserCheck, Home,
  Palette, Scissors, Wrench, Heart, ArrowRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portals',
  description: 'Access your personalized portal. Whether you are a student, employer, partner, parent, staff member, or client, find your dedicated dashboard here.',
  keywords: ['student portal', 'employer portal', 'partner portal', 'parent portal', 'staff portal', 'client portal', 'dashboard', 'login'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/portals' },
};

// Portal keys shown on the hub page (in display order)
const PORTAL_KEYS: PortalKey[] = [
  'lms',
  'employer',
  'apprentice',
  'hostshop',
  'cosmetology',
  'instructor',
  'casemanager',
  'partner',
  'programholder',
  'workforce',
  'admin',
  'staff',
  'workforceboard',
  'provider',
  'parent',
];

// Enhanced portal metadata with features and full descriptions
const PORTAL_DETAILS: Record<string, { description: string; features: string[] }> = {
  lms: {
    description: 'Access your courses, track progress, view grades, manage your schedule, and connect with instructors and career services.',
    features: ['Course Materials', 'Grade Tracking', 'Career Services', 'Schedule Management'],
  },
  employer: {
    description: 'Post jobs, manage apprentices, track training progress, access compliance documents, and connect with program coordinators.',
    features: ['Job Postings', 'Apprentice Management', 'Compliance Documents', 'Hiring Tools'],
  },
  apprentice: {
    description: "Track your apprenticeship hours, log competencies, manage timeclock, access your handbook, and prepare for state board exams.",
    features: ['Hour Tracking', 'Competency Logs', 'Timeclock', 'State Board Prep'],
  },
  hostshop: {
    description: 'Manage apprentices, approve hours, track OJL, view syllabus, and monitor RTI progress for your salon or barbershop.',
    features: ['Apprentice Management', 'Hour Approvals', 'OJL Tracking', 'RTI Monitoring'],
  },
  cosmetology: {
    description: 'Access cosmetology-specific training materials, track beauty program hours, and manage your salon apprenticeship.',
    features: ['Beauty Training', 'Hour Tracking', 'State License Prep', 'Salon Placement'],
  },
  instructor: {
    description: 'View your student roster, review lab and assignment submissions, track completions, and manage course content.',
    features: ['Student Roster', 'Submission Review', 'Grade Tracking', 'Course Management'],
  },
  casemanager: {
    description: 'Track assigned participants, verify enrollments, record job placements, and generate WIOA compliance reports.',
    features: ['Caseload Management', 'Enrollment Verification', 'Job Placements', 'WIOA Reports'],
  },
  partner: {
    description: "Record attendance, manage apprentice hours, access MOU documents, and track your organization's program involvement.",
    features: ['Attendance Recording', 'Hours Tracking', 'MOU Documents', 'Program Reports'],
  },
  programholder: {
    description: 'Manage your programs, track enrollments, handle compliance documentation, and monitor student outcomes.',
    features: ['Program Management', 'Enrollment Tracking', 'Compliance Docs', 'Outcomes Reports'],
  },
  workforce: {
    description: 'Access workforce development tools, manage training programs, and connect job seekers with career pathways.',
    features: ['Training Programs', 'Career Pathways', 'Job Matching', 'Funding Management'],
  },
  admin: {
    description: 'Full platform administration including students, courses, payments, testing, CRM, and system configuration.',
    features: ['Student Management', 'Course Administration', 'Payment Processing', 'System Settings'],
  },
  staff: {
    description: 'Manage students, record attendance, flag at-risk learners, run reports, and coordinate daily operations.',
    features: ['Student Management', 'Attendance Tracking', 'At-Risk Flags', 'Reports'],
  },
  workforceboard: {
    description: 'Workforce board portal for managing regional workforce development initiatives, employer partnerships, and program analytics.',
    features: ['Regional Analytics', 'Employer Partnerships', 'Program Oversight', 'Reporting'],
  },
  provider: {
    description: 'Service provider portal for managing workforce services, participant tracking, and outcome reporting.',
    features: ['Service Management', 'Participant Tracking', 'Outcome Reporting', 'Billing'],
  },
  parent: {
    description: 'Monitor your student progress, view attendance, communicate with instructors, and track career development.',
    features: ['Progress Monitoring', 'Attendance View', 'Instructor Communication', 'Career Tracking'],
  },
};

const colorClasses: Record<string, { bg: string; border: string; light: string }> = {
  blue: { bg: 'bg-brand-blue-600', border: 'border-brand-blue-200', light: 'bg-brand-blue-50' },
  green: { bg: 'bg-green-600', border: 'border-green-200', light: 'bg-green-50' },
  red: { bg: 'bg-brand-red-600', border: 'border-brand-red-200', light: 'bg-red-50' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-200', light: 'bg-teal-50' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  pink: { bg: 'bg-pink-600', border: 'border-pink-200', light: 'bg-pink-50' },
};

const IconMap: Record<string, React.ElementType> = {
  GraduationCap, Shield, Handshake, Briefcase, Users,
  Building2, Crown, ClipboardList, UserCheck,
  Palette, Scissors, Wrench, Heart,
};

const portals = PORTAL_KEYS.map((key) => {
  const meta = PORTAL_META[key];
  const Icon = IconMap[meta.iconName] ?? Building2;
  const details = PORTAL_DETAILS[key] || { description: meta.description, features: [] };
  const colors = colorClasses[meta.colorClass] || colorClasses.blue;
  return {
    key,
    href: PortalRouter.get(key),
    icon: Icon,
    title: meta.label,
    description: details.description,
    features: details.features,
    colors,
  };
});

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Portals' }]} />
        </div>
      </div>

      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Access Your Portal</h1>
          <p className="text-blue-200 text-lg">Select the portal that matches your role.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.key}
                  href={portal.href}
                  className={`bg-white rounded-xl border ${portal.colors.border} p-6 shadow-md hover:shadow-xl transition-all group flex flex-col`}
                >
                  <div className={`w-14 h-14 rounded-xl ${portal.colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-blue-600 transition-colors">
                    {portal.title}
                  </h2>
                  <p className="text-sm text-slate-600 mb-4 flex-1">{portal.description}</p>
                  {portal.features.length > 0 && (
                    <div className="space-y-1">
                      {portal.features.slice(0, 3).map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-slate-500">
                          <div className={`w-1.5 h-1.5 rounded-full ${portal.colors.bg.replace('bg-', 'bg-')}`} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${portal.colors.bg.replace('bg-', 'text-')}`}>
                    Access Portal <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-16 bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Need access to a portal?</h3>
            <p className="text-slate-600 mb-6">Contact our support team for assistance with portal access or permissions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-red-700 transition-colors"
              >
                Contact Support
              </Link>
              <a
                href="tel:+13173143757"
                className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors"
              >
                (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

