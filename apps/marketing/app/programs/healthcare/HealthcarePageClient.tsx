'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import UltraVideoPlayer from '@/components/video/UltraVideoPlayer';
import type { Program } from '@/lib/lms/types';

const programImages: Record<string, string> = {
  cna: '/images/healthcare/hero-program-patient-care.jpg',
  'cna-cert': '/images/healthcare/hero-program-patient-care.jpg',
  'cna-training-wrg': '/images/healthcare/hero-program-patient-care.jpg',
  'direct-support-professional': '/images/healthcare/hero-program-medical-assistant.jpg',
  'dsp-training': '/images/healthcare/hero-program-medical-assistant.jpg',
  'drug-collector': '/images/healthcare/hero-program-phlebotomy.jpg',
  'medical-assistant': '/images/healthcare/hero-program-medical-assistant.jpg',
  'phlebotomy-technician': '/images/healthcare/hero-program-phlebotomy.jpg',
  'pharmacy-technician': '/images/healthcare/hero-program-medical-assistant.jpg',
  'dental-assistant': '/images/healthcare/hero-program-patient-care.jpg',
  default: '/images/healthcare/hero-program-patient-care.jpg',
};

function formatDuration(weeks: number) {
  if (!weeks) return 'Flexible';
  if (weeks <= 2) return '1-2 Weeks';
  if (weeks <= 4) return '2-4 Weeks';
  if (weeks <= 6) return '4-6 Weeks';
  if (weeks <= 8) return '6-8 Weeks';
  return `${weeks} Weeks`;
}

export default function HealthcarePageClient({ programs }: { programs: Program[] }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative flex h-[clamp(260px,42svh,480px)] w-full items-center overflow-hidden bg-slate-900">
        <UltraVideoPlayer
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-previews/course-cna.mp4"
          className="absolute inset-0 w-full h-full object-cover brightness-110"
          autoPlayOnMount
          playThrough={false}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Healthcare Programs
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mb-8">
              Explore healthcare training with program-specific tuition, clinical, credential, and funding disclosures.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/apply?program=healthcare"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/wioa-eligibility"
                className="inline-flex items-center text-white text-lg border-b-2 border-white pb-1 hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Healthcare" programSlug="healthcare" />

      {/* Programs Grid */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Healthcare Programs
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Healthcare Path
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Funding varies by healthcare program. Review the exact program record before relying on WIOA, Workforce Ready Grant, or another payment source.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link
                key={program.id || program.slug}
                href={`/programs/${program.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{
                      backgroundImage: `url(${programImages[program.slug] ?? programImages['default']})`,
                    }}
                    role="img"
                    aria-label={program.title}
                  />
                  {program.duration && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {program.duration}
                    </div>
                  )}
                  {program.funded && (
                    <div className="absolute top-3 left-3 bg-brand-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Review funding
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">{program.description}</p>
                  <span className="text-blue-600 font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">See Details<span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What You&apos;ll Learn
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Healthcare curriculum and clinical requirements differ by program. Review the exact program page for the skills, lab, and supervised-practice requirements that apply.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Patient Care Skills</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>• Vital signs monitoring</li>
                <li>• Patient hygiene assistance</li>
                <li>• Mobility and transfer techniques</li>
                <li>• Infection control procedures</li>
                <li>• Documentation and charting</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Clinical Procedures</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>• Blood draw techniques (Phlebotomy)</li>
                <li>• Specimen collection</li>
                <li>• Medical equipment operation</li>
                <li>• Emergency response basics</li>
                <li>• CPR and First Aid</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Professional Skills</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>• HIPAA compliance</li>
                <li>• Medical terminology</li>
                <li>• Patient communication</li>
                <li>• Team collaboration</li>
                <li>• Healthcare ethics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Requirements</h2>
            <p className="text-lg text-slate-600">
              What you need to get started in healthcare training.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-green-700 mb-4">Basic Requirements</h3>
              <ul className="space-y-3">
                {[
                  '18 years or older',
                  'High school diploma or GED',
                  'Pass background check',
                  'Reliable transportation',
                ].map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-slate-900">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-blue-700 mb-4">For Agency Funding Review</h3>
              <ul className="space-y-3">
                {[
                  'Open the exact program funding disclosure',
                  'Complete the responsible agency intake',
                  'Confirm both participant and program eligibility',
                  'Obtain written authorization before funded training begins',
                ].map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-slate-900">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 lg:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Career Outcomes</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Healthcare labor-market conditions vary by occupation, employer, geography, and reporting period.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { stat: 'Program', label: 'Duration varies by healthcare pathway' },
              { stat: 'Credential', label: 'Authority disclosed by program' },
              { stat: 'Clinical', label: 'Requirements disclosed by program' },
              { stat: 'Employment', label: 'Outcomes are not guaranteed' },
            ].map(({ stat, label }) => (
              <div key={label} className="text-center">
                <div className="text-5xl font-black text-white mb-2">{stat}</div>
                <p className="text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 text-center">
            Healthcare Program FAQ
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What healthcare certifications can I earn?',
                a: 'CNA (Certified Nursing Assistant), Phlebotomy Technician, Medical Assistant, Direct Support Professional, and more depending on the program.',
              },
              {
                q: 'How long is CNA training?',
                a: 'CNA training is typically 4-6 weeks including classroom instruction and clinical hours. You must complete 75 hours of training to be eligible for the state exam.',
              },
              {
                q: 'Is the training really free?',
                a: 'Do not assume a healthcare program is free. Review the exact program page. If workforce funding is verified for that program, the responsible agency still determines participant eligibility, covered costs, available funds, and written authorization.',
              },
              {
                q: 'Where will I do clinical training?',
                a: 'Clinical or supervised-practice requirements vary by program. The applicable program page and enrollment materials identify whether clinical training is required and where an approved placement will occur.',
              },
              {
                q: 'Can I work while in training?',
                a: 'Yes, many students work part-time while in training. Classes are scheduled to accommodate working adults when possible.',
              },
              {
                q: 'What if I have a criminal record?',
                a: 'Some healthcare positions have background check requirements. We can discuss your specific situation and help identify programs that may be available to you.',
              },
              {
                q: 'Do you help with job placement?',
                a: 'Career services can include resume help, interview preparation, job-search support, and employer connections. Placement and employment are not guaranteed.',
              },
              {
                q: 'What is the state CNA exam like?',
                a: 'The Indiana CNA competency evaluation includes knowledge and skills requirements. Review the current state testing instructions and your program materials for the applicable exam process. No pass-rate guarantee is made.',
              },
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-slate-900">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Healthcare Career?
          </h2>
          <p className="text-blue-100 mb-8">
            Review the selected healthcare program for current tuition and any verified funding pathway.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=healthcare"
              className="inline-block bg-white text-blue-600 px-8 py-4 font-semibold rounded-full hover:bg-blue-50 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-block border-2 border-white text-slate-900 px-8 py-4 font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
