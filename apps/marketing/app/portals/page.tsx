import { Metadata } from 'next';
import Link from 'next/link';
import { PortalRouter, PORTAL_META, type PortalKey } from '@/lib/routing/portal-router';
import {
  ArrowRight,
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Crown,
  GraduationCap,
  Heart,
  Palette,
  Scissors,
  Shield,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portals',
  description:
    'Access your personalized Elevate portal for learning, apprenticeships, employers, partners, workforce services, testing, staff, and administration.',
  keywords: ['student portal', 'employer portal', 'host shop portal', 'parent portal', 'staff portal', 'dashboard', 'login'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/portals' },
};

/** Distinct canonical portal destinations only. No role aliases. */
const PORTAL_KEYS: PortalKey[] = [
  'lms',
  'apprentice',
  'hostshop',
  'employer',
  'parent',
  'workforce',
  'instructor',
  'staff',
  'testing',
  'programholder',
  'provider',
  'casemanager',
  'workforceboard',
  'creator',
  'admin',
];

const PORTAL_DETAILS: Partial<Record<PortalKey, { description: string; features: string[] }>> = {
  lms: {
    description: 'Access courses, track progress, view grades, manage your schedule, and connect with instructors and career services.',
    features: ['Course Materials', 'Progress Tracking', 'Certificates', 'Career Services'],
  },
  apprentice: {
    description: 'Track apprenticeship hours, RTI, competencies, documents, and training progress.',
    features: ['OJT Hours', 'RTI', 'Competencies', 'Documents'],
  },
  hostshop: {
    description: 'Manage apprentices, approve hours, track OJT, maintain compliance documents, and monitor RTI progress.',
    features: ['Apprentice Management', 'Hour Approvals', 'Compliance', 'RTI Monitoring'],
  },
  employer: {
    description: 'Post jobs, manage candidates and apprentices, and access employer partnership tools.',
    features: ['Job Postings', 'Candidates', 'Apprenticeships', 'Hiring Tools'],
  },
  parent: {
    description: 'Monitor linked student progress, attendance, and communications.',
    features: ['Progress Monitoring', 'Attendance', 'Communications'],
  },
  workforce: {
    description: 'Access workforce development tools, training participation, placements, and career pathways.',
    features: ['Training', 'Career Pathways', 'Placements', 'Workforce Services'],
  },
  instructor: {
    description: 'View student rosters, review submissions, track completions, and manage instructional work.',
    features: ['Student Roster', 'Submission Review', 'Progress', 'Courses'],
  },
  staff: {
    description: 'Manage students, enrollments, at-risk flags, reports, and daily operations.',
    features: ['Students', 'Enrollments', 'At-Risk Flags', 'Reports'],
  },
  testing: {
    description: 'Manage testing bookings, sessions, slots, providers, and proctoring operations.',
    features: ['Bookings', 'Sessions', 'Slots', 'Proctoring'],
  },
  programholder: {
    description: 'Manage programs, students, hours, documents, and compliance responsibilities.',
    features: ['Programs', 'Students', 'Hours', 'Compliance'],
  },
  provider: {
    description: 'Manage provider programs, enrollments, onboarding, compliance, and service delivery.',
    features: ['Programs', 'Enrollments', 'Onboarding', 'Compliance'],
  },
  casemanager: {
    description: 'Track assigned participants, enrollments, credentials, placements, and case activity.',
    features: ['Caseload', 'Enrollments', 'Credentials', 'Placements'],
  },
  workforceboard: {
    description: 'Review regional workforce participation, providers, programs, credentials, and outcomes.',
    features: ['Regional Analytics', 'Providers', 'Programs', 'Outcomes'],
  },
  creator: {
    description: 'Build and publish learning products through the creator workspace.',
    features: ['Products', 'Content', 'Publishing'],
  },
  admin: {
    description: 'Platform administration for applications, students, programs, CRM, compliance, testing, and system operations.',
    features: ['Applications', 'Students', 'Programs', 'Operations'],
  },
};

const IconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Shield,
  Briefcase,
  Users,
  Building2,
  Crown,
  ClipboardList,
  ClipboardCheck,
  UserCheck,
  Palette,
  Scissors,
  Wrench,
  Heart,
};

const portals = PORTAL_KEYS.map((key) => {
  const meta = PORTAL_META[key];
  const details = PORTAL_DETAILS[key] ?? { description: meta.description, features: [] };
  return {
    key,
    href: PortalRouter.get(key),
    icon: IconMap[meta.iconName] ?? Building2,
    title: meta.label,
    description: details.description,
    features: details.features,
    colorClass: meta.colorClass,
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
          <p className="text-blue-200 text-lg">Select the workspace that matches your role.</p>
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
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-md hover:shadow-xl transition-all group flex flex-col"
                >
                  <div className={`w-14 h-14 rounded-xl ${portal.colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
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
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-blue-600">
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
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-red-700 transition-colors">
                Contact Support
              </Link>
              <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors">
                (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
