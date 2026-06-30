export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';
import { CleanPageHero } from '@/components/programs/CleanPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Drug & Alcohol Specimen Collector Certification | DOT Training | Indianapolis',
  description:
    'DOT-certified drug and alcohol specimen collector training. 2-3 weeks. High demand across transportation, healthcare, and corporate sectors. Funded for eligible participants.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/drug-alcohol-specimen-collector' },
};

const CREDENTIALS = [
  { name: 'DOT Urine Specimen Collector Certification', issuer: 'U.S. Department of Transportation', description: 'Federal certification for collecting urine specimens under DOT-regulated testing programs.' },
  { name: 'DOT Breath Alcohol Technician (BAT)', issuer: 'U.S. Department of Transportation', description: 'Certification to operate evidential breath testing devices for DOT-regulated employers.' },
  { name: 'Non-DOT Collection Certification', issuer: PLATFORM_DEFAULTS.orgName, description: 'Certification for workplace drug testing programs not subject to DOT regulations.' },
];

const FAQS = [
  { question: 'How long is the training?', answer: '2–3 weeks depending on scheduling. Training includes both online instruction and hands-on practice with collection procedures.' },
  { question: 'Is prior medical experience required?', answer: 'No. This program teaches all required skills from the ground up. A high school diploma or GED is the only prerequisite.' },
  { question: 'Where do specimen collectors work?', answer: 'Medical laboratories, occupational health clinics, mobile collection services, corporate testing programs, transportation companies, and third-party administrators.' },
  { question: 'Is this certification in demand?', answer: 'Yes. Every DOT-regulated employer (trucking, rail, aviation, transit) is required to conduct drug and alcohol testing. Demand is consistent across all economic conditions.' },
  { question: 'Is funding available?', answer: 'WIOA and Workforce Ready Grant funding is available for eligible Indiana residents. Many participants pay $0.' },
];

export default function DrugAlcoholSpecimenCollectorPage() {
  return (
    <main className="min-h-screen bg-white">
      <CleanPageHero
        src="/images/healthcare/healthcare-professional-portrait-1.jpg"
        alt="Healthcare professional in specimen collection lab"
        title="Drug & Alcohol Specimen Collector"
        subtitle="DOT-certified training. High demand across transportation, healthcare, and corporate sectors."
        priority
      />

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">2–3 Weeks</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">15–20</p>
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
            Become a certified Drug &amp; Alcohol Specimen Collector and work in healthcare facilities, labs, and workplace testing programs. This specialized certification is in high demand across transportation, healthcare, and corporate sectors.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Our DOT-approved training meets all federal requirements for urine and breath alcohol specimen collection. Graduates are qualified to work for any DOT-regulated employer — including trucking companies, airlines, transit systems, and railroads — as well as non-DOT corporate testing programs. Starting pay ranges from $16–$22/hour.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application. No prior medical experience required.' },
              { step: 2, title: 'Enroll', desc: 'Confirm WIOA/WRG funding eligibility or choose self-pay.' },
              { step: 3, title: 'Train', desc: '2–3 weeks covering DOT regulations, specimen collection procedures, breath alcohol testing, and chain of custody.' },
              { step: 4, title: 'Credential', desc: 'Earn DOT Urine Specimen Collector, BAT, and Non-DOT Collection certifications.' },
              { step: 5, title: 'Employment', desc: 'Job placement into labs, clinics, mobile collection services, and corporate testing programs.' },
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
            programName="Drug & Alcohol Specimen Collector"
            fundingSources={['WIOA', 'Workforce Ready Grant']}
            selfPayPrice={1200}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get DOT-certified in weeks, not months.
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            High-demand specialized certification. Funded for eligible participants. Apply today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=drug-alcohol-specimen-collector"
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
