
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Building, BarChart, Users, FileText, ArrowRight,
  Shield, Globe, Clock, Target,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Board Solutions | Elevate For Humanity',
  description: 'Workforce development platform for regional workforce boards. WIOA compliance, participant tracking, DOL reporting, and provider management.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/workforce-boards' },
  openGraph: {
    title: 'Workforce Board Solutions | Elevate For Humanity',
    description: 'Workforce development platform for regional workforce boards.',
    url: 'https://www.elevateforhumanity.org/platform/workforce-boards',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/hero-images/wioa-hero.jpg', width: 1200, height: 630, alt: 'Workforce Board Solutions' }],
    type: 'website',
  },
};

const features = [
  { icon: Users, title: 'Participant Tracking', description: 'Track WIOA participants from intake through enrollment, training, and employment outcomes.' },
  { icon: BarChart, title: 'Performance Metrics', description: 'Real-time dashboards for DOL primary indicators of performance and state reporting.' },
  { icon: FileText, title: 'Compliance Management', description: 'Automated documentation, eligibility verification, and audit-ready records.' },
  { icon: Building, title: 'Provider Network', description: 'Manage training providers, program approvals, and ETPL status in one place.' },
  { icon: Shield, title: 'Data Security', description: 'FERPA-compliant data handling with role-based access and encryption.' },
  { icon: Globe, title: 'Multi-Region Support', description: 'Manage multiple service areas, offices, and partner organizations.' },
];

const complianceAreas = [
  { title: 'WIOA Title I', items: ['Adult', 'Dislocated Worker', 'Youth', 'National Dislocated Worker Grants'] },
  { title: 'Performance Reporting', items: ['Employment Rate Q2 & Q4', 'Median Earnings', 'Credential Attainment', 'Measurable Skill Gains'] },
  { title: 'Eligibility & Intake', items: ['Automated eligibility screening', 'Digital intake forms', 'Document verification', 'Co-enrollment tracking'] },
  { title: 'Fiscal Management', items: ['ITA tracking', 'OJT contracts', 'Supportive services', 'Budget monitoring'] },
];

export default function WorkforceBoardsPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Workforce Boards' }]} />
          <p className="text-sm text-slate-600 font-medium mt-1">Part of the <a href="/platform" className="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p>
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image src="/hero-images/wioa-hero.jpg" alt="Workforce Board Solutions" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Workforce Board Solutions</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Streamline WIOA compliance, maximize participant outcomes, and simplify DOL reporting.</p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-brand-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {['WIOA Compliant', 'DOL Reporting', 'FERPA Secure', 'Real-time Analytics', 'Audit-Ready'].map((item, i) => (
              <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-brand-blue-700 text-sm font-medium shadow-sm">
                <span className="text-slate-400 flex-shrink-0">•</span> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for workforce development boards and their unique compliance requirements.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for WIOA Compliance</h2>
            <p className="text-lg text-gray-600">Every compliance area covered, from eligibility to performance reporting.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {complianceAreas.map((area, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">{area.title}</h3>
                <div className="space-y-2">
                  {area.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Integrates With Your Ecosystem</h2>
              <p className="text-gray-600 mb-6">
                Connect with existing state systems and workforce tools for seamless data flow.
              </p>
              <div className="space-y-4">
                {[
                  'State workforce database integration',
                  'ETPL management and program approval workflows',
                  'Automated DOL quarterly and annual reporting',
                  'Provider performance scorecards',
                  'Participant case management and follow-up tracking',
                  'Budget monitoring and fiscal reporting',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/technology/hero-program-it-support.jpg" alt="Workforce board dashboard" fill sizes="100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Modernize Your Workforce Operations</h2>
          <p className="text-brand-blue-100 text-lg mb-8">See how our platform can streamline your WIOA compliance and improve participant outcomes.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="px-8 py-4 bg-white text-brand-blue-800 font-bold rounded-lg hover:bg-brand-blue-50 transition inline-flex items-center gap-2">
              Schedule Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/store/compliance/wioa" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition">
              WIOA Compliance Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
