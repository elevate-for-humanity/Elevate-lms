
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MapPin } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/state-programs' },
  title: 'Indiana State Funding Programs | Elevate For Humanity',
  description: 'Indiana state workforce development funding including Next Level Jobs, Workforce Ready Grant, and employer training grants.',
};

const PROGRAMS = [
  {
    name: 'Next Level Jobs — Workforce Ready Grant',
    admin: 'Indiana Commission for Higher Education',
    desc: 'Covers tuition and fees for eligible certificate programs in high-demand fields. Available at approved training providers across Indiana.',
    fields: ['Healthcare', 'IT & Business', 'Advanced Manufacturing', 'Transportation & Logistics', 'Building & Construction'],
    eligible: ['Indiana resident', 'Do not already hold a bachelor\'s degree', 'Enroll in an eligible certificate program'],
  },
  {
    name: 'Next Level Jobs — Employer Training Grant',
    admin: 'Indiana Department of Workforce Development',
    desc: 'Reimburses employers up to $5,000 per employee for training costs in high-demand sectors. Employers apply on behalf of their workers.',
    fields: ['Advanced Manufacturing', 'Agriculture', 'Building & Construction', 'Health & Life Sciences', 'IT & Business Services', 'Transportation & Logistics'],
    eligible: ['Indiana-based employer', 'Training in an eligible high-demand sector', 'Employee must be an Indiana resident'],
  },
  {
    name: 'WIOA State Set-Aside Funds',
    admin: 'Indiana Department of Workforce Development (DWD)',
    desc: 'State-level WIOA discretionary funds for special workforce initiatives, rapid response to layoffs, and statewide workforce projects.',
    fields: ['Varies by initiative'],
    eligible: ['Determined by specific initiative', 'Typically targets underserved populations or regions'],
  },
  {
    name: 'Justice Reinvestment Initiative (JRI)',
    admin: 'Indiana Department of Correction / DWD',
    desc: 'Provides funding for career training and supportive services for justice-involved individuals transitioning back into the workforce.',
    fields: ['Skilled Trades', 'Healthcare', 'CDL/Transportation', 'Technology'],
    eligible: ['Justice-involved individuals', 'Must meet program-specific criteria'],
  },
];

export default function StateProgramsPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'State Programs' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Indiana state funding programs" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">State Funding Programs</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Indiana workforce development grants and training funds for residents and employers.</p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {PROGRAMS.map((p) => (
            <div key={p.name} className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{p.name}</h2>
              <p className="text-sm text-gray-500 mb-4">Administered by: {p.admin}</p>
              <p className="text-gray-700 mb-4">{p.desc}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Eligible Fields:</h3>
                  <div className="flex flex-wrap gap-2">
                    {p.fields.map((f) => (
                      <span key={f} className="bg-brand-blue-50 text-brand-blue-700 text-xs font-medium px-3 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Who May Be Eligible:</h3>
                  <p className="text-gray-600 text-sm">{p.eligible.join('. ')}.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Explore Your Funding Options</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">Our enrollment team will help match you with the right state funding program.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/orientation/schedule" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Attend Orientation</Link>
            <Link href="/contact" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
