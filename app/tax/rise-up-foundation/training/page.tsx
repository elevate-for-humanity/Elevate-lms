import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import VITAPageHero from '@/components/supersonic/VITAPageHero';

export const metadata: Metadata = {
  title: 'Volunteer Training — IRS Link & Learn | Rise Up Foundation',
  description: 'Complete IRS Link & Learn Taxes training to become a certified VITA volunteer. Free online training with certification exam.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation/training' },
};

const CERTIFICATIONS = [
  { level: 'Basic', desc: 'Covers W-2 income, standard deductions, Earned Income Tax Credit, Child Tax Credit, and most common individual returns. Required for all preparers.', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { level: 'Advanced', desc: 'Adds itemized deductions, Schedule D (capital gains), Schedule E (rental income), and more complex credits. Recommended for experienced volunteers.', image: '/images/pages/admin-tax-training-hero.jpg' },
  { level: 'Military', desc: 'Covers military-specific tax issues including combat pay exclusion, moving expenses, and state tax considerations for service members.', image: '/images/pages/admin-compliance-hero.jpg' },
  { level: 'International', desc: 'Covers returns for non-resident aliens, foreign income exclusion, and treaty benefits. Required for sites serving international clients.', image: '/images/pages/admin-ferpa-training-hero.jpg' },
];

const MODULES = [
  { title: 'Filing Basics', desc: 'Filing status, dependents, standard vs. itemized deductions, and the basic structure of Form 1040.', image: '/images/pages/admin-tax-filing-hero.jpg' },
  { title: 'Income', desc: 'Wages, salaries, tips, interest, dividends, unemployment compensation, Social Security benefits, and retirement distributions.', image: '/images/pages/finance-accounting.jpg' },
  { title: 'Credits', desc: 'Earned Income Tax Credit, Child Tax Credit, Child and Dependent Care Credit, education credits, and retirement savings credits.', image: '/images/pages/supersonic-tax-cert.jpg' },
  { title: 'Quality Review', desc: 'How to review a completed return for accuracy before filing. Every return must pass quality review by a second certified volunteer.', image: '/images/pages/admin-tax-reports-hero.jpg' },
  { title: 'Intake Interview', desc: 'How to conduct the client intake interview, complete Form 13614-C, and identify the correct filing status and dependents.', image: '/images/pages/supersonic-page-7.jpg' },
  { title: 'Ethics & Security', desc: 'IRS Volunteer Standards of Conduct, data security requirements, and taxpayer confidentiality obligations.', image: '/images/pages/admin-compliance-hero.jpg' },
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-white">
      <VITAPageHero
        image="/images/pages/admin-tax-training-hero.jpg"
        alt="IRS Link and Learn VITA volunteer training"
        title="IRS Link & Learn Volunteer Training"
        subtitle="Free online certification training for VITA volunteers. Complete at your own pace. No tax background required."
      />

      {/* OVERVIEW */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">About IRS Link & Learn</h2>
              <p className="text-lg text-slate-600 mb-5 leading-relaxed">
                IRS Link & Learn Taxes is the free online training and certification program for VITA volunteers. All training is provided by the IRS at no cost. You complete the coursework online at your own pace and take a certification exam at the end.
              </p>
              <p className="text-slate-600 mb-5 leading-relaxed">
                Most volunteers complete Basic certification in 8–12 hours. Advanced certification adds another 4–6 hours. Certification is valid for one tax season and must be renewed annually.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                You must score 80% or higher on the certification exam. You can retake the exam as many times as needed. Rise Up Foundation provides additional support and practice materials to help you prepare.
              </p>
              <a href="https://www.irs.gov/individuals/irs-link-and-learn-taxes" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors">
                Start IRS Training →
              </a>
            </div>
            <div className="relative h-[420px] rounded-2xl overflow-hidden">
              <Image src="/images/pages/admin-ferpa-training-hero.jpg" alt="IRS Link and Learn training" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATION LEVELS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Certification Levels</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">All preparers must complete Basic certification. Additional levels are available for volunteers who want to handle more complex returns.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.level} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={cert.image} alt={cert.level} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute top-3 left-3 bg-emerald-700 text-white text-sm font-black px-3 py-1 rounded-lg">{cert.level}</div>
                </div>
                <div className="p-5 flex-1 bg-white">
                  <p className="text-slate-600 text-sm leading-relaxed">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING MODULES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What You Will Learn</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">The Basic certification covers six core modules. Each module includes reading material, interactive scenarios, and a knowledge check.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((mod) => (
              <div key={mod.title} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={mod.image} alt={mod.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/rise-foundation-page-2.jpg" alt="Start IRS training" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-emerald-900/75 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to Get Certified?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.irs.gov/individuals/irs-link-and-learn-taxes" target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-white text-emerald-900 font-black text-xl rounded-xl hover:bg-emerald-50 transition-colors">Start IRS Training</a>
              <Link href="/tax/rise-up-foundation/volunteer" className="px-10 py-4 bg-emerald-700 text-white font-black text-xl rounded-xl hover:bg-emerald-600 transition-colors">Apply to Volunteer</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
