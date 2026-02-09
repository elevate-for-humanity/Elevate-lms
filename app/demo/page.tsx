import { Metadata } from 'next';
import Link from 'next/link';
import { 
  GraduationCap, 
  Settings, 
  Building2, 
  ArrowRight, 
  Calendar, 
  Info,
  Play,
  BarChart3
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DemoStartButtons } from './DemoStartButtons';

export const metadata: Metadata = {
  title: 'Demo Environment | Elevate LMS',
  description: 'Explore the Elevate LMS through guided demo experiences. See the full platform in action with real workflows for institutions, partners, and workforce programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/demo',
  },
};

const DEMO_TOURS = [
  {
    id: 'institution_admin',
    title: 'Institution / Admin License',
    description: 'Full administrative control over programs, students, compliance, and reporting. Perfect for training providers and educational institutions.',
    icon: Settings,
    color: 'green',
    features: [
      'Student enrollment pipeline',
      'Program & course management',
      'WIOA compliance reporting',
      'Audit logs & security',
    ],
    checkoutUrl: '/store/licenses/managed-platform',
  },
  {
    id: 'partner_employer',
    title: 'Partner / Employer License',
    description: 'Employer portal for hiring, apprenticeship management, and workforce pipeline access. Ideal for employers and industry partners.',
    icon: Building2,
    color: 'blue',
    features: [
      'Candidate pipeline access',
      'Apprenticeship tracking',
      'Hiring incentive management',
      'MOU & compliance docs',
    ],
    checkoutUrl: '/store/licenses/pro-license',
  },
  {
    id: 'workforce_program',
    title: 'Workforce / Program License',
    description: 'Complete workforce development platform with funding integration, outcome tracking, and multi-stakeholder coordination.',
    icon: GraduationCap,
    color: 'blue',
    features: [
      'WIOA funding workflows',
      'Multi-agency coordination',
      'Outcome & placement tracking',
      'Performance dashboards',
    ],
    checkoutUrl: '/store/licenses/enterprise-license',
  },
];

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Demo' }]} />
        </div>
      </div>

      {/* Live Platform Banner */}
      <div className="bg-green-600 text-white py-2 px-4 text-center text-sm">
        <Info className="w-4 h-4 inline mr-2" />
        Live Platform Preview — Explore the actual LMS, admin dashboards, and workflows with guided tours
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-lg font-bold text-slate-900 hover:text-orange-600 transition">
              Elevate for Humanity
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/store/licenses" className="text-slate-600 hover:text-orange-600 transition text-sm">
                Licensing Info
              </Link>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
              >
                <Calendar className="w-4 h-4" />
                Book a Call
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Guided Platform Demos
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience the complete Workforce Operating System through guided tours. 
              Each demo walks you through real workflows, from enrollment to compliance reporting.
            </p>
          </div>

          {/* Demo Tour Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {DEMO_TOURS.map((tour) => {
              const Icon = tour.icon;
              const colorClasses = {
                green: {
                  bg: 'bg-green-100',
                  bgHover: 'group-hover:bg-green-500',
                  text: 'text-green-600',
                  textHover: 'group-hover:text-white',
                  border: 'hover:border-green-500',
                  cta: 'text-green-600',
                },
                blue: {
                  bg: 'bg-blue-100',
                  bgHover: 'group-hover:bg-blue-500',
                  text: 'text-blue-600',
                  textHover: 'group-hover:text-white',
                  border: 'hover:border-blue-500',
                  cta: 'text-blue-600',
                },
                blue: {
                  bg: 'bg-blue-100',
                  bgHover: 'group-hover:bg-blue-500',
                  text: 'text-blue-600',
                  textHover: 'group-hover:text-white',
                  border: 'hover:border-blue-500',
                  cta: 'text-blue-600',
                },
              }[tour.color];

              return (
                <div
                  key={tour.id}
                  className={`group bg-white rounded-2xl border-2 border-slate-200 p-8 ${colorClasses.border} hover:shadow-lg transition-all`}
                >
                  <div className={`w-16 h-16 ${colorClasses.bg} rounded-xl flex items-center justify-center mb-6 ${colorClasses.bgHover} transition`}>
                    <Icon className={`w-8 h-8 ${colorClasses.text} ${colorClasses.textHover} transition`} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{tour.title}</h2>
                  <p className="text-slate-600 mb-6">{tour.description}</p>
                  <ul className="text-sm text-slate-500 space-y-2 mb-6">
                    {tour.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                  <div className="space-y-3">
                    <Link
                      href={`/demo/tour/${tour.id}?step=1`}
                      className={`inline-flex items-center gap-2 ${colorClasses.cta} font-semibold group-hover:gap-3 transition-all`}
                    >
                      <Play className="w-4 h-4" />
                      Start Guided Tour
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="text-xs text-slate-400">
                      ~15 min • Real workflows • Ends at checkout
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Access Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-16">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Access (No Tour)</h2>
            <p className="text-slate-600 mb-6">
              Jump directly into specific portals without the guided tour.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                href="/demo/learner"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">Student LMS</div>
                  <div className="text-sm text-slate-500">Courses & progress</div>
                </div>
              </Link>
              <Link
                href="/demo/admin"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition"
              >
                <Settings className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-semibold text-slate-900">Admin Dashboard</div>
                  <div className="text-sm text-slate-500">Management & reports</div>
                </div>
              </Link>
              <Link
                href="/demo/employer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <Building2 className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">Employer Portal</div>
                  <div className="text-sm text-slate-500">Hiring & apprentices</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Admin Controls */}
          <DemoStartButtons />

          {/* CTA Section */}
          <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to license the platform?
            </h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Schedule a call to discuss implementation, pricing, and how the Workforce OS can work for your organization.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/schedule"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-700 transition text-lg"
              >
                <Calendar className="w-5 h-5" />
                Schedule a Call
              </Link>
              <Link
                href="/store/licenses"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition text-lg"
              >
                <BarChart3 className="w-5 h-5" />
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Elevate for Humanity. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/store/licenses" className="text-slate-500 text-sm hover:text-orange-600 transition">Licensing</Link>
              <Link href="/contact" className="text-slate-500 text-sm hover:text-orange-600 transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
