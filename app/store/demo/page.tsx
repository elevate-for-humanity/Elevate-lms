import { Metadata } from 'next';
import Link from 'next/link';
import {
  Play,
  Shield,
  GraduationCap,
  Briefcase,
  BarChart3,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Platform Demo | Elevate Workforce OS',
  description: 'See the Elevate Workforce Operating System in action. Guided tours of the admin, learner, employer, and instructor experiences.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/demo',
  },
};

const tours = [
  {
    title: 'Admin Dashboard',
    icon: Shield,
    tourId: 'institution_admin',
    license: 'Managed Platform',
    description: 'Organization management, enrollment oversight, compliance reporting, and user administration.',
    highlights: [
      'Multi-program enrollment dashboard',
      'WIOA compliance reporting',
      'Student progress tracking',
      'Partner and employer management',
    ],
  },
  {
    title: 'Employer Portal',
    icon: Briefcase,
    tourId: 'partner_employer',
    license: 'Managed Platform',
    description: 'Candidate pipelines, apprenticeship management, and workforce reporting for employer partners.',
    highlights: [
      'Candidate matching and pipelines',
      'Apprenticeship progress monitoring',
      'Hiring outcome tracking',
      'Compliance documentation',
    ],
  },
  {
    title: 'Workforce Program',
    icon: BarChart3,
    tourId: 'workforce_program',
    license: 'Enterprise Source-Use',
    description: 'WIOA eligibility, funding management, outcome tracking, and federal reporting for workforce boards.',
    highlights: [
      'WIOA eligibility determination',
      'Grant funding management',
      'Outcome and placement tracking',
      'Federal compliance reporting',
    ],
  },
  {
    title: 'Learner Experience',
    icon: GraduationCap,
    tourId: null,
    license: 'All licenses',
    description: 'Course delivery, progress tracking, credential issuance, and career services from the student perspective.',
    highlights: [
      'Course modules and assessments',
      'Apprenticeship hour logging',
      'Certificate and credential tracking',
      'Job placement pipeline',
    ],
  },
];

export default function StoreDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Demo' }]} />
          <p className="text-sm text-slate-600 mt-1">
            Guided tours of the <a href="/platform" className="text-brand-red-600 font-medium hover:underline">Elevate Workforce Operating System</a>
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 sm:py-18 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Play className="w-4 h-4" /> Guided Platform Tour
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            See the Platform in Action
          </h1>
          <p className="mt-6 text-lg text-white/90 max-w-2xl mx-auto">
            Walk through each role in the Workforce OS — admin, learner, employer, and instructor.
            These are guided tours showing real workflows, not a sandbox.
          </p>
          <div className="mt-8">
            <Link
              href="/store/licenses"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors text-lg"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tour cards */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-12">
            {tours.map((tour, i) => (
              <div
                key={tour.title}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
              >
                {/* Screenshot placeholder */}
                <div className="w-full md:w-1/2 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-video flex items-center justify-center">
                  <div className="text-center p-8">
                    <tour.icon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">{tour.title}</p>
                    {tour.tourId ? (
                      <Link
                        href={`/demo/tour/${tour.tourId}?step=1`}
                        className="inline-flex items-center gap-2 mt-3 px-5 py-2 bg-brand-red-600 text-white text-sm font-bold rounded-lg hover:bg-brand-red-700 transition-colors"
                      >
                        <Play className="w-4 h-4" /> Start Tour
                      </Link>
                    ) : (
                      <p className="text-slate-400 text-sm mt-2">Included in all licenses</p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-3 mb-1">
                    <tour.icon className="w-6 h-6 text-brand-red-600" />
                    <h2 className="text-2xl font-bold text-slate-900">{tour.title}</h2>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {tour.license}
                  </p>
                  <p className="text-slate-800 mb-4">{tour.description}</p>
                  <ul className="space-y-2 mb-4">
                    {tour.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-slate-800 text-sm">
                        <BarChart3 className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  {tour.tourId && (
                    <Link
                      href={`/demo/tour/${tour.tourId}?step=1`}
                      className="inline-flex items-center gap-2 text-brand-red-600 font-semibold text-sm hover:underline"
                    >
                      Start {tour.title} Tour <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            You&apos;ve seen how the Workforce OS works across all roles.
          </h2>
          <p className="text-slate-800 mb-8">
            Most organizations can get started immediately.
          </p>
          <div className="flex justify-center">
            <Link
              href="/store/licenses"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors text-lg"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            <Link href="/contact?topic=enterprise-review" className="text-slate-600 hover:underline">Enterprise / Government review</Link>
            {' · '}
            <Link href="/contact" className="text-slate-600 hover:underline">Compliance or procurement questions</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
