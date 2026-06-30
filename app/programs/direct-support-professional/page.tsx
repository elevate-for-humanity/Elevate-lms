export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';
import { CleanPageHero } from '@/components/programs/CleanPageHero';

export const metadata: Metadata = {
  title: 'Direct Support Professional Training | Free DSP Program Indiana',
  description:
    '100% free DSP training program. Help individuals with disabilities live fulfilling lives. 4-6 weeks, job placement included. Indianapolis.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/direct-support-professional' },
};

const CREDENTIALS = [
  { name: 'NADSP Credential', issuer: 'National Alliance for Direct Support Professionals', description: 'National credential validating competency in person-centered support services.' },
  { name: 'CPR/First Aid Certification', issuer: 'American Heart Association', description: 'Emergency response certification required for all direct care workers.' },
  { name: 'Medication Administration Certification', issuer: 'Indiana FSSA', description: 'State-required certification to administer medications in residential settings.' },
];

const FAQS = [
  { question: 'Do I need prior healthcare experience?', answer: 'No. This program is designed for adults entering the disability services field for the first time. All training is provided.' },
  { question: 'Is this program really free?', answer: 'Yes. DSP training is funded through WIOA and Workforce Ready Grant for eligible Indiana residents. Most participants pay $0.' },
  { question: 'What hours do DSPs work?', answer: 'DSPs work a variety of shifts depending on the setting — day, evening, overnight, and weekend shifts are all common. Full-time and part-time positions available.' },
  { question: 'Where will I work after completing the program?', answer: 'Graduates work in group homes, day programs, community living settings, vocational programs, and respite care. Job placement support is included.' },
];

export default function DirectSupportProfessionalPage() {
  return (
    <main className="min-h-screen bg-white">
      <CleanPageHero
        src="/images/gallery/image2.webp"
        alt="Direct Support Professional training session"
        title="Direct Support Professional"
        subtitle="Help individuals with disabilities live independently. Free training with job placement included."
        priority
      />

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">4–6 Weeks</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">20–30</p>
            <p className="text-slate-400 text-sm">Hours / Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Hybrid</p>
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
            Direct Support Professionals provide essential care and support to individuals with intellectual and developmental disabilities. This rewarding career helps people live independently and participate fully in their communities.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Our free training program prepares you for immediate employment in residential facilities, day programs, and community settings. Starting pay ranges from $14–$18/hour with consistent demand and opportunities for advancement into team lead and program management roles.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application. No prior experience required.' },
              { step: 2, title: 'Enroll', desc: 'Confirm WIOA/WRG funding eligibility — most participants pay $0.' },
              { step: 3, title: 'Train', desc: '4–6 weeks covering person-centered care, health/safety, behavioral support, and communication.' },
              { step: 4, title: 'Credential', desc: 'Earn NADSP credential, CPR/First Aid, and Medication Administration certifications.' },
              { step: 5, title: 'Employment', desc: 'Job placement support into group homes, day programs, and community living settings.' },
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
            programName="Direct Support Professional"
            fundingSources={['WIOA', 'Workforce Ready Grant']}
            selfPayPrice={0}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start your DSP career — free training, fast placement.
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            100% funded for eligible participants. Job placement included. Apply today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=direct-support-professional"
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
