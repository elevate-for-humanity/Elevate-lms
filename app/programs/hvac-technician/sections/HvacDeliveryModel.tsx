import { BookOpen, Building, BarChart3, Shield, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { COMPETENCIES } from '../hvac-program-data';

export function HvacDeliveryModel() {
  return (
    <>
      {/* Training Delivery Model */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Training Delivery Model</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Programs are delivered through a structured workforce training model that includes licensed credential partners for instruction, hands-on lab training, mapped competencies, and LMS-tracked progress under centralized program oversight.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Related Technical Instruction (RTI)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Delivered by licensed credential partners and structured instructional modules. Covers HVAC theory, electrical systems, refrigeration, air distribution, and code compliance through classroom and hands-on lab instruction.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Building className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Hands-On Lab Training</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Practical training with real HVAC equipment including residential heating and cooling units, refrigeration systems, electrical panels, and diagnostic tools in a supervised training environment.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Progress Tracking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Competency tracking through institutional LMS, evaluation rubrics, instructor assessments, and certification exam preparation milestones.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Program Oversight</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Oversight provided by Elevate program holders and sponsor framework. Curriculum includes specific learning objectives, learning checkpoints, and a structured timeline/calendar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Program Structure</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Training hours are documented through LMS tracking, instructor evaluations, and certification exam results to ensure consistent skill development.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">20 Weeks</div>
              <div className="text-slate-500 text-sm">Total Duration</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">$5,000</div>
              <div className="text-slate-500 text-sm">Total Training Cost</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
              <Shield className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">6</div>
              <div className="text-slate-500 text-sm">Credentials Earned</div>
            </div>
          </div>

          {/* Workforce Ready Grant */}
          <div className="mt-8 bg-brand-green-50 border border-brand-green-200 rounded-xl p-6">
            <h3 className="font-bold text-brand-green-900 mb-2">Workforce Ready Grant Eligible</h3>
            <p className="text-sm text-brand-green-800 leading-relaxed">
              This program is eligible for the Indiana Workforce Ready Grant through Next Level Jobs. Qualifying Indiana residents may complete this program at no cost. Visit <a href="https://www.nextleveljobs.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">NextLevelJobs.org</a> for more information, or submit our intake form to check your eligibility.
            </p>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Additional funding through WIOA and payment plans also available. Contact us or submit the intake form to find out which options you qualify for.
          </p>
        </div>
      </section>

      {/* Core Competencies */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Core Competencies</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Participants demonstrate mastery through structured assessments, hands-on evaluations, and certification exams.
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
