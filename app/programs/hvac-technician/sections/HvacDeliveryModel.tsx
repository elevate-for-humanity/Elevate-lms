import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { COMPETENCIES } from '../hvac-program-data';

export function HvacDeliveryModel() {
  return (
    <>
      {/* Training Delivery — image-driven cards */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">How You&apos;ll Train</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Classroom instruction, hands-on labs with real equipment, and certification prep — all in 20 weeks.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-48">
                <Image src="/images/programs-hq/training-classroom.jpg" alt="Students in HVAC classroom instruction" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Classroom &amp; Theory</h3>
                <p className="text-slate-600 text-sm leading-relaxed">HVAC fundamentals, electrical systems, refrigeration cycles, air distribution, and building codes. Instructor-led with LMS coursework.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-48">
                <Image src="/images/trades/program-hvac-technician.jpg" alt="Hands-on HVAC lab training with equipment" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Hands-On Labs</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Work on real residential heating and cooling units, refrigeration systems, electrical panels, and diagnostic tools in a supervised training facility.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-48">
                <Image src="/images/programs-hq/electrical.jpg" alt="Electrical wiring and controls training" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Electrical &amp; Controls</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Wiring, circuit analysis, thermostat programming, and control systems. Hands-on work with real HVAC electrical components.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-48">
                <Image src="/images/programs-hq/skilled-trades-hero.jpg" alt="HVAC certification exam preparation" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Certification Prep</h3>
                <p className="text-slate-600 text-sm leading-relaxed">EPA 608 Universal, OSHA 30, and Residential HVAC Certification exam preparation with practice tests and instructor coaching.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Structure — clean stats */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Program at a Glance</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="text-3xl font-black text-brand-blue-600">20</div>
                  <div><div className="font-bold text-slate-900">Weeks</div><div className="text-slate-500 text-sm">Full-time program duration</div></div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="text-3xl font-black text-brand-blue-600">6</div>
                  <div><div className="font-bold text-slate-900">Credentials</div><div className="text-slate-500 text-sm">EPA 608, HVAC Cert 1 &amp; 2, OSHA 30, CPR, Rise Up</div></div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="text-3xl font-black text-brand-blue-600">$0</div>
                  <div><div className="font-bold text-slate-900">With Workforce Ready Grant</div><div className="text-slate-500 text-sm">Qualifying Indiana residents pay nothing</div></div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="text-3xl font-black text-brand-blue-600">$5K</div>
                  <div><div className="font-bold text-slate-900">Self-Pay Tuition</div><div className="text-slate-500 text-sm">Payment plans, Affirm, and Sezzle available</div></div>
                </div>
              </div>
            </div>
            <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/trades/program-hvac-overview.jpg"
                alt="HVAC technician servicing residential unit"
                fill className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Workforce Ready Grant callout */}
          <div className="mt-10 bg-brand-green-50 border border-brand-green-200 rounded-xl p-6">
            <h3 className="font-bold text-brand-green-900 mb-2">Workforce Ready Grant Eligible</h3>
            <p className="text-sm text-brand-green-800 leading-relaxed">
              This program is eligible for the Indiana Workforce Ready Grant through Next Level Jobs. Qualifying Indiana residents may complete this program at no cost. Visit <a href="https://www.nextleveljobs.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">NextLevelJobs.org</a> for more information, or submit our intake form to check your eligibility.
            </p>
          </div>
        </div>
      </section>

      {/* Mid-page CTA break with image */}
      <section className="relative py-20 overflow-hidden">
        <Image
          src="/images/programs-hq/hvac-technician.jpg"
          alt="HVAC training in progress"
          fill className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Earn $45K-$75K in 20 Weeks</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            HVAC technicians are in demand year-round. Start training now and be job-ready by next season.
          </p>
          <Link href="/programs/hvac-technician/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Core Competencies — condensed */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">What You&apos;ll Master</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Hands-on evaluations and certification exams verify every skill.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPETENCIES.map((comp, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{comp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
