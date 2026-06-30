export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';
import { CleanPageHero } from '@/components/programs/CleanPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Building Services Technician Apprenticeship | DOL Registered | Indianapolis',
  description:
    'DOL Registered Apprenticeship in building services and facility maintenance. 6,000-hour program with paid OJT. Multi-story window cleaning, building maintenance, and more.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/building-services-technician' },
};

const CREDENTIALS = [
  { name: 'DOL Journeyworker Certificate', issuer: 'U.S. Department of Labor', description: 'Nationally recognized credential upon completing 6,000 hours of on-the-job training.' },
  { name: 'OSHA 10/30 Safety Certification', issuer: 'U.S. Department of Labor', description: 'Industry-standard workplace safety certification for construction and maintenance.' },
  { name: 'Competency Certificate', issuer: `${PLATFORM_DEFAULTS.orgName} / 2Exclusive LLC`, description: 'Documentation of all skills and competencies mastered during the apprenticeship.' },
];

const FAQS = [
  { question: 'How long is the apprenticeship?', answer: 'The program is 6,000 hours, which typically takes 3 years working full-time. This is one of our most comprehensive apprenticeships.' },
  { question: 'Do I get paid during training?', answer: 'Yes. You are employed from day one and earn wages throughout the entire apprenticeship. Your pay increases as you progress through training milestones.' },
  { question: 'Is this program free?', answer: 'As a registered apprenticeship, you earn while you learn. There is no tuition — your employer sponsors your training.' },
  { question: 'What is the job outlook?', answer: 'Building services is a stable, in-demand field. Every commercial building needs maintenance, and skilled technicians are always needed. Journeyworker wage averages ~$19/hr.' },
];

export default function BuildingServicesTechnicianPage() {
  return (
    <main className="min-h-screen bg-white">
      <CleanPageHero
        src="/images/programs/efh-building-tech-hero.jpg"
        alt="Building Services Technician working on facility maintenance"
        title="Building Services Technician"
        subtitle="DOL Registered Apprenticeship. Earn while you learn with paid on-the-job training."
        priority
      />

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">6,000 hrs</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">40</p>
            <p className="text-slate-400 text-sm">Hours / Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">In-Person</p>
            <p className="text-slate-400 text-sm">Delivery</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-slate-400 text-sm">Credentials</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            Building Services Technicians are skilled professionals who maintain and service commercial and residential buildings. This includes multi-story window cleaning, general building maintenance, HVAC support, plumbing basics, electrical systems, and facility management.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            As a DOL Registered Apprenticeship (RAPIDS Code: 0688CB), you complete 6,000 hours of on-the-job training while earning wages that increase as you progress. Upon completion, you receive a nationally recognized Journeyworker Certificate from the U.S. Department of Labor.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application. Must be 18+ with a high school diploma or GED.' },
              { step: 2, title: 'Enroll', desc: 'Get hired by an approved employer. Start working and earning from day one.' },
              { step: 3, title: 'Train', desc: 'Learn on-the-job alongside experienced journeyworkers — window cleaning, building maintenance, facility services.' },
              { step: 4, title: 'Credential', desc: 'Complete 6,000 hours and earn your DOL Journeyworker Certificate and OSHA safety certifications.' },
              { step: 5, title: 'Employment', desc: 'Continue with your employer at full journeyworker wages (~$19/hr) or advance into facility management.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 text-sm mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Credentials You Earn</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CREDENTIALS.map((cred) => (
              <div key={cred.name} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cred.name}</h3>
                <p className="text-xs text-brand-blue-600 font-medium mb-2">{cred.issuer}</p>
                <p className="text-sm text-slate-600">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding & Payment */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Funding &amp; Payment</h2>
          <FundingInfoBlock
            programName="Building Services Technician"
            fundingSources={['Employer-Sponsored Apprenticeship', 'WIOA Supportive Services']}
            selfPayPrice={0}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Earn while you learn — no tuition required.
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            DOL Registered Apprenticeship. Paid from day one. Apply today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=building-services-technician"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Check Eligibility
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900 text-sm flex items-center justify-between">
                  {faq.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
