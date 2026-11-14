import Image from 'next/image';
import { COMPETENCIES } from '../barber-program-data';
import { getProgram } from '@/lib/programs/canonical-data';

export function BarberDeliveryModel() {
  const program = getProgram('barber-apprenticeship');
  const ojlHours = program?.ojtHours ?? 2000;
  const rtiHours = program?.relatedInstructionHours ?? 144;
  const totalTrainingHours = ojlHours + rtiHours;
  const duration = program?.durationRange ?? 'Approximately 50 weeks at 40 OJL hours/week';

  return (
    <>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Training Delivery Model</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Programs are delivered through a structured workforce training model that includes licensed credential partners for instruction, employer-based hands-on training where applicable, mapped competencies, and LMS-tracked progress under centralized program oversight.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="relative" style={{ aspectRatio: '3/2' }}>
                <Image placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==" src="/images/pages/barber-apprenticeship.webp" alt="Barber classroom instruction" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Related Technical Instruction (RTI)</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Delivered by licensed credential partners and supervised instructional modules. Includes classroom instruction, LMS-based coursework, and structured evaluations aligned to competency standards.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="relative" style={{ aspectRatio: '3/2' }}>
                <Image src="/images/pages/barber-gallery-1.webp" alt="Apprentice cutting hair in licensed barbershop" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">On-the-Job Learning (OJL)</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Conducted in approved licensed barbershops under licensed barber supervision. Includes real client services, shop operations, sanitation practices, and professional skill development.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="relative" style={{ aspectRatio: '3/2' }}>
                <Image src="/images/pages/barber-apprentice-learning.webp" alt="Barber apprentice progress tracking" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Progress Tracking</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Competency tracking through institutional LMS, evaluation rubrics, monthly OJL employer evaluations, and tri-party competency verification (RTI + Employer + Program Oversight).</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="relative" style={{ aspectRatio: '3/2' }}>
                <Image src="/images/pages/barber-styling-hair.webp" alt="Licensed barbershop training environment" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">Program Oversight</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Oversight is provided through the registered sponsor framework and Elevate program administration. Employer training sites must maintain required licensing and provide documented evaluations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Program Structure</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Training hours are documented through OJL logs, LMS tracking, and supervisor evaluations. RTI is a separate requirement and is not subtracted from supervised OJL hours.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="text-xl font-black text-brand-red-600 mb-1">{duration}</div>
              <div className="text-sm font-bold text-slate-900">Expected Duration</div>
              <div className="text-slate-500 text-xs mt-1">Schedule and progress dependent</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="text-3xl font-black text-brand-red-600 mb-1">{totalTrainingHours.toLocaleString()}</div>
              <div className="text-sm font-bold text-slate-900">Total Training Hours</div>
              <div className="text-slate-500 text-xs mt-1">{ojlHours.toLocaleString()} OJL + {rtiHours.toLocaleString()} RTI</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="text-3xl font-black text-brand-red-600 mb-1">{rtiHours.toLocaleString()}</div>
              <div className="text-sm font-bold text-slate-900">RTI Hours</div>
              <div className="text-slate-500 text-xs mt-1">Separate from OJL</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <div className="text-3xl font-black text-brand-red-600 mb-1">$4,980</div>
              <div className="text-sm font-bold text-slate-900">Published Program Cost</div>
              <div className="text-slate-500 text-xs mt-1">Funding and payment options may apply</div>
            </div>
          </div>

          <div className="mt-8 bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
            <h3 className="font-bold text-brand-red-900 mb-2">Registered Apprenticeship Structure</h3>
            <p className="text-sm text-brand-red-800 leading-relaxed">
              Elevate&apos;s registered Barber Apprenticeship uses {ojlHours.toLocaleString()} supervised OJL hours plus {rtiHours.toLocaleString()} RTI hours. Indiana licensing requirements are administered by the Indiana Professional Licensing Agency; completion of the registered apprenticeship and applicable licensing/examination requirements are separate compliance checkpoints.
            </p>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Flexible payment options may be available. Funding eligibility depends on the participant, approved funding source, program status, and required authorization.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Core Competencies</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Participants demonstrate mastery through structured assessments, rubric evaluations, and documented skill verification. This ensures objective skill verification in addition to required training hours.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPETENCIES.map((comp, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <span className="w-6 h-6 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-slate-700">{comp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
