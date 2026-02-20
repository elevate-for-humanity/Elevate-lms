import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone, Shield } from 'lucide-react';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';
import { CAREERS, EMPLOYERS, ENROLLMENT_STEPS, ELIGIBILITY } from '../hvac-program-data';

export function HvacEnrollment() {
  return (
    <>
      {/* Career Pathways — with image */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Career Pathways</h2>
              <p className="text-white/80 mb-8">
                Graduates enter the workforce with 6 industry-recognized credentials including EPA 608. HVAC technicians are in high demand across Indiana.
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
              <h3 className="text-xl font-bold text-white mb-4">Hiring Employers</h3>
              <div className="grid grid-cols-2 gap-3">
                {EMPLOYERS.map((emp, i) => (
                  <div key={i} className="bg-white/20 rounded-lg px-4 py-3 text-white font-medium text-sm">
                    {emp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tuition & Payment — with image side */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[380px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/programs-hq/students-learning.jpg"
                alt="Students in workforce training program"
                fill className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Tuition &amp; Payment</h2>
              <p className="text-slate-600 mb-6">
                Multiple funding pathways. Many qualifying Indiana residents complete this program at no cost.
              </p>
              <div className="space-y-3">
                <div className="bg-brand-green-50 rounded-xl p-4 border border-brand-green-200">
                  <h3 className="font-bold text-brand-green-900">Workforce Ready Grant</h3>
                  <p className="text-brand-green-700 text-sm">No cost for qualifying residents via Next Level Jobs</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900">WIOA Funding</h3>
                  <p className="text-slate-600 text-sm">Through your local WorkOne office</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900">Self-Pay: $5,000</h3>
                  <p className="text-slate-600 text-sm">Payment plans, Affirm, Sezzle, or pay in full</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900">Employer Sponsored</h3>
                  <p className="text-slate-600 text-sm">Invoice or sponsorship agreement available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility & Enrollment */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-4">Eligibility &amp; How to Enroll</h2>

          <div className="grid lg:grid-cols-2 gap-8 mt-10">
            {/* Eligibility */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Requirements</h3>
              <div className="space-y-3">
                {ELIGIBILITY.map((req, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0 mt-2" />
                    <span className="text-slate-700 text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Enrollment Steps</h3>
              <div className="space-y-3">
                {ENROLLMENT_STEPS.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white rounded-lg p-4 border border-slate-200">
                    <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                      <p className="text-slate-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-blue-800 leading-relaxed">
                This program is accredited and aligned with workforce training standards. It incorporates structured RTI, mapped competencies, documented progress reporting, and is eligible for the Indiana Workforce Ready Grant through Next Level Jobs. Enrollment is contingent upon eligibility and funding availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Start Your HVAC Career
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            20-week program. 6 credentials. Workforce Ready Grant eligible. Apply today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/programs/hvac-technician/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </Link>
          </div>
          <div className="mt-6 flex justify-center">
            <ProgramTutorCTA
              programSlug="hvac-technician"
              programName="HVAC Technician"
              applyHref="/programs/hvac-technician/apply"
              suggestions={['What is EPA 608?', 'How long is the program?', 'Is tuition covered?', 'What jobs can I get?']}
            />
          </div>
        </div>
      </section>
    </>
  );
}
