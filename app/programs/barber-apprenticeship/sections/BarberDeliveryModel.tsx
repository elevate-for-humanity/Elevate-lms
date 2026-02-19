import { BookOpen, Building, BarChart3, Shield, Clock, Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import { COMPETENCIES } from '../barber-program-data';

export function BarberDeliveryModel() {
  return (
    <>
      {/* Section 2 — Training Delivery Model */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Training Delivery Model</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Programs are delivered through a structured workforce training model that includes licensed credential partners for instruction, employer-based hands-on training where applicable, mapped competencies, and LMS-tracked progress under centralized program oversight.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Related Technical Instruction (RTI)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Delivered by licensed credential partners and supervised instructional modules. Includes classroom instruction, LMS-based coursework, and structured evaluations aligned to competency standards.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center mb-4">
                <Building className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">On-the-Job Training (OJT)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Conducted in approved licensed barbershops under licensed barber supervision. Includes real client services, shop operations, sanitation practices, and professional skill development.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Progress Tracking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Competency tracking through institutional LMS, evaluation rubrics, monthly OJT employer evaluations, and tri-party competency verification (RTI + Employer + Program Oversight).</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Program Oversight</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Oversight provided by Elevate program holders and sponsor framework. All employer training sites are approved and required to maintain active licensing and provide monthly evaluations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Program Structure (Mapped Hours) */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Program Structure</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Training hours are documented through OJT logs, LMS tracking, and supervisor evaluations to ensure consistent skill development and compliance with workforce training standards.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">15 Months</div>
              <div className="text-slate-500 text-sm">Total Duration</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">2,000</div>
              <div className="text-slate-500 text-sm">OJT Hours (Licensed Shops)</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">Structured</div>
              <div className="text-slate-500 text-sm">RTI Hours (Competency-Aligned)</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">$4,890</div>
              <div className="text-slate-500 text-sm">Total Training Cost</div>
            </div>
          </div>

          {/* Licensure Pathway Alignment */}
          <div className="mt-8 bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
            <h3 className="font-bold text-brand-red-900 mb-2">Licensure Pathway Alignment</h3>
            <p className="text-sm text-brand-red-800 leading-relaxed">
              The 2,000-hour apprenticeship training structure is designed to support skill development aligned with barber licensure pathways where applicable. Training hours are documented through supervised OJT logs, competency evaluations, and institutional progress tracking systems. Participants are responsible for meeting any additional state licensing requirements as governed by applicable licensing boards.
            </p>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Flexible payment options available including pay-in-full, payment plans, and Buy Now Pay Later (BNPL) options. Funding eligibility may vary based on individual workforce programs, partner sponsorships, or external approvals.
          </p>
        </div>
      </section>

      {/* Section 4 — Core Competencies */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Core Competencies</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Participants demonstrate mastery through structured assessments, rubric evaluations, and documented skill verification. This ensures objective skill verification rather than time-based completion alone.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPETENCIES.map((comp, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <CheckCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{comp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
