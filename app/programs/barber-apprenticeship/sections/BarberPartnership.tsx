import Link from 'next/link';
import Image from 'next/image';
import { CAREERS, PARTNER_REQUIREMENTS, PARTNER_BENEFITS } from '../barber-program-data';

export function BarberPartnership() {
  return (
    <>
      {/* Career Image */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[360px]">
        <Image src="/images/pages/barber-shop-interior.jpg" alt="Professional barbershop interior" fill sizes="100vw" className="object-cover" />
      </section>

      {/* Section 7 — Career Pathways */}
      <section className="py-16 bg-brand-red-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Career Pathways</h2>
              <p className="text-white/80 mb-8">
                Graduates enter the workforce with industry-recognized credentials and documented competencies. Career pathways include licensed barber positions, shop management, and business ownership.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {CAREERS.map((career, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-white">{career.title}</h3>
                    <p className="text-white/80 text-sm">{career.salary}/year</p>
                    {career.demand && <p className="text-white/60 text-xs mt-1">{career.demand}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Industry Sectors</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Licensed Barbershops', 'Salon & Spa', 'Hotel & Resort', 'Entertainment & Media', 'Sports Teams', 'Private Clients', 'Shop Ownership', 'Franchise Operations'].map((emp, i) => (
                  <div key={i} className="bg-white/20 rounded-lg px-4 py-3 text-white font-medium text-sm">
                    {emp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7.5 — Progress Tracking */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Progress Tracking &amp; Reporting</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            All participant progress is documented and available to workforce partners upon request.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'LMS module completion tracking',
              'RTI attendance documentation',
              'Monthly OJT employer evaluations',
              'Competency rubric assessments',
              'Cohort progress reporting available to partners',
              'Credential attainment records',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <span className="w-6 h-6 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 — Transfer Hours */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Transfer Hours &amp; Prior Training</h2>
          <p className="text-slate-600 mb-6 max-w-3xl">
            Participants with prior barber training, apprenticeship hours, or documented industry experience may be eligible for transfer hour evaluation.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            {[
              'Documented training records from prior programs',
              'Verified employer or school hours',
              'Competency assessment review',
              'Institutional hour calculator and evaluation process',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0 mt-2" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Approved transfer hours may be applied toward the 2,000-hour training requirement based on documented verification and program review standards. Final approval is determined through formal evaluation.
          </p>
        </div>
      </section>

      {/* Section 9 — Partnership Barbershops */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Partnership Barbershops &amp; Training Sites</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            The Barber Apprenticeship Program is delivered in collaboration with approved licensed barbershop partners that serve as official On-the-Job Training (OJT) sites. Partnership shops may operate under hourly employment, booth-based training, or hybrid arrangements depending on shop policies.
          </p>
          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-4">Partner Shop Requirements</h3>
              <div className="space-y-2">
                {PARTNER_REQUIREMENTS.map((req, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0 mt-2" />
                    <span className="text-slate-700 text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-4">Partnership Benefits</h3>
              <div className="space-y-2">
                {PARTNER_BENEFITS.map((ben, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-green-600 rounded-full flex-shrink-0 mt-2" />
                    <span className="text-slate-700 text-sm">{ben}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link href="/programs/barber-apprenticeship/host-shops" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-8 py-4 rounded-lg transition-colors">
              Become a Partner Shop &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
