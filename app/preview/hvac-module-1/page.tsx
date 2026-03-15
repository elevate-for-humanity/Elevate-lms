'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { quiz } from '@/courses/hvac/module1/quiz1'

const HVACLab = dynamic(() => import('@/components/HVACLab'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-white rounded-xl flex items-center justify-center text-slate-500">
      Loading 3D equipment lab...
    </div>
  ),
})

const VIDEO_URL =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac/hvac-module1-lesson1.mp4'

const SECTIONS = [
  { id: 'video', label: 'Video' },
  { id: 'overview', label: 'Overview' },
  { id: 'components', label: 'Components' },
  { id: 'lab', label: '3D Lab' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'quiz', label: 'Quiz' },
]

function SectionHeader({ id, number, title }: { id: string; number: number; title: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-4 scroll-mt-32">
      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </span>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  )
}

export default function HVACModule1Page() {
  const [labComplete, setLabComplete] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)

  const quizScore = quiz.filter((q, i) => quizAnswers[i] === q.answer).length
  const quizPassed = quizScore >= 4

  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true)
    if (quizPassed) {
      setModuleComplete(true)
      try {
        await fetch('/api/lessons/hvac-module1-lesson1/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizScore, labComplete, videoWatched: true }),
        })
      } catch {
        // best-effort
      }
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Module header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="text-sm font-medium text-brand-blue-400 mb-2">Module 1</div>
          <h1 className="text-3xl md:text-4xl font-bold">HVAC System Overview</h1>
          <p className="mt-3 text-slate-300 text-lg max-w-2xl">
            Learn the major components of a residential air conditioning condenser unit and how
            technicians inspect them during service calls.
          </p>
        </div>
      </div>

      {/* Sticky section nav */}
      <nav className="sticky top-[70px] z-30 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-brand-blue-50 hover:text-brand-blue-700 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Video */}
      <div id="video" className="max-w-4xl mx-auto px-4 pt-10 scroll-mt-32">
        <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
          <video controls preload="metadata" className="aspect-video w-full" src={VIDEO_URL} />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Watch the full lesson video covering every component and the inspection walkthrough.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-16">

        {/* Section 1 — Overview */}
        <section>
          <SectionHeader id="overview" number={1} title="What Is an HVAC System?" />
          <div className="prose max-w-none text-slate-700">
            <p>
              HVAC stands for <strong>Heating, Ventilation, and Air Conditioning</strong>. These
              systems control the temperature, humidity, and air quality inside residential and
              commercial buildings.
            </p>
            <p>
              A standard residential cooling system is a <strong>split system</strong> with two
              halves. The <strong>indoor unit</strong> contains the evaporator coil and blower motor.
              The <strong>outdoor unit</strong> is the condenser — it contains the compressor,
              condenser coil, fan motor, and electrical controls.
            </p>
            <p>
              The condenser is where technicians spend most of their diagnostic time. Understanding
              its components — what they do, where they are, and how they fail — is the foundation
              of HVAC service work.
            </p>
          </div>
        </section>

        {/* Section 2 — Components */}
        <section>
          <SectionHeader id="components" number={2} title="Condenser Unit Components" />
          <p className="text-slate-600 mb-6">
            A residential condenser unit contains six major components. Click each card to expand.
          </p>
          <div className="space-y-4">
            {[
              { name: 'Compressor', desc: 'The compressor is the heart of the refrigeration cycle. It receives low-pressure, low-temperature refrigerant gas from the indoor evaporator coil and compresses it into high-pressure, high-temperature gas. This pressurized gas then flows through the condenser coil where it releases heat to the outdoor air.', inspect: 'Check amperage draw against the nameplate rating. Listen for unusual noises. Measure suction and discharge pressures with a gauge manifold.' },
              { name: 'Condenser Coil', desc: 'A network of copper tubing with aluminum fins that wraps around the inside of the condenser cabinet. Hot refrigerant gas from the compressor flows through the coil. As the fan pulls outdoor air across the fins, the refrigerant releases heat and changes from gas to liquid.', inspect: 'Look for bent fins, debris buildup, and corrosion. Clean with coil cleaner and low-pressure water from inside out. Never use a pressure washer.' },
              { name: 'Fan Motor', desc: 'Drives the fan blade that pulls outdoor air across the condenser coil. Without airflow, the coil cannot reject heat and the system will overheat. Mounted at the top of the unit behind a protective grille.', inspect: 'Spin the blade by hand with power off. It should rotate freely. Check the run capacitor. Measure motor amperage and compare to nameplate.' },
              { name: 'Capacitor', desc: 'Stores and releases electrical energy to start and run the compressor and fan motors. A dual-run capacitor serves both motors. Capacitors are the single most common failure point in residential HVAC.', inspect: 'Visually check for bulging or leaking. Test with a multimeter set to microfarads. Replace if reading is more than 10% below rated value. Always discharge before handling.' },
              { name: 'Contactor', desc: 'An electrically controlled switch. When the thermostat calls for cooling, it sends 24V to the contactor coil, which pulls the contacts closed and connects 240V line voltage to the compressor and fan motor.', inspect: 'Look for pitting, burn marks, or carbon buildup on contact surfaces. Check that the coil pulls in firmly when energized. Measure voltage on both sides of the contacts.' },
              { name: 'Service Valves', desc: 'Access ports on the refrigerant lines where they exit the condenser. The larger line (suction) carries low-pressure gas. The smaller line (liquid) carries high-pressure liquid. Technicians connect gauge manifolds here to measure pressures and charge refrigerant.', inspect: 'Check valve caps are in place. A missing cap is the number one cause of slow leaks. Inspect for oil stains around valve stems.' },
            ].map((comp) => (
              <details key={comp.name} className="rounded-xl border bg-white shadow-sm overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{comp.name}</h3>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{comp.desc}</p>
                  <div className="mt-3 rounded-lg bg-white border px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      How technicians inspect it
                    </div>
                    <p className="text-sm text-slate-700">{comp.inspect}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Section 3 — 3D Lab */}
        <section>
          <SectionHeader id="lab" number={3} title="Interactive 3D Equipment Lab" />
          <p className="text-slate-600 mb-4">
            Click directly on any part of the condenser unit to identify it. Drag to rotate, scroll to
            zoom. Identify all 7 components to complete the lab.
          </p>
          <HVACLab onAllIdentified={() => setLabComplete(true)} />
          {labComplete && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium text-center">
              All components identified. Continue to the inspection walkthrough below.
            </div>
          )}
        </section>

        {/* Section 4 — Inspection */}
        <section>
          <SectionHeader id="inspection" number={4} title="Technician Inspection Walkthrough" />
          <p className="text-slate-600 mb-6">
            When a technician arrives at a service call for a condenser unit that is not cooling,
            they follow these four steps.
          </p>
          <div className="space-y-4">
            {[
              { step: 'Visual Inspection', detail: 'Walk around the condenser unit. Look for debris blocking airflow, damaged fan blades, disconnected wiring, or a unit that is not level. Check that the disconnect is ON. Look for oil stains on refrigerant lines — oil indicates a refrigerant leak.' },
              { step: 'Check Airflow', detail: 'With the system running, place your hand over the top grille. You should feel strong, warm air being discharged. Weak airflow means the condenser coil is dirty or the fan motor is failing. No airflow means the fan is not running — check the capacitor and contactor.' },
              { step: 'Inspect the Capacitor', detail: 'Turn off power at the disconnect. Remove the electrical compartment panel. Visually inspect the capacitor for bulging, leaking, or burn marks. Discharge it safely. Test with a multimeter on the microfarad setting. Compare to the rated value on the label.' },
              { step: 'Connect Manifold Gauges', detail: 'Connect your gauge manifold to the service valves. Let the system run for 10 to 15 minutes to stabilize. Compare suction and discharge pressures to the manufacturer specifications for the current outdoor temperature.' },
            ].map((item, idx) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 rounded-xl border bg-white shadow-sm px-5 py-4">
                  <h4 className="font-bold text-slate-900">{item.step}</h4>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => scrollTo('quiz')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold transition"
            >
              Ready? Take the Quiz
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </section>

        {/* Section 5 — Quiz */}
        <section>
          <SectionHeader id="quiz" number={5} title="Knowledge Check" />
          <p className="text-slate-600 mb-6">
            Answer all 5 questions. You need at least 4 correct to pass.
          </p>
          <div className="space-y-6">
            {quiz.map((q, qIdx) => {
              const selected = quizAnswers[qIdx]
              const isCorrect = selected === q.answer
              const showResult = quizSubmitted
              return (
                <div
                  key={qIdx}
                  className={`rounded-xl border shadow-sm overflow-hidden ${
                    showResult ? (isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'bg-white'
                  }`}
                >
                  <div className="px-5 py-4">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                        {qIdx + 1}
                      </span>
                      <p className="font-semibold text-slate-900 pt-0.5">{q.question}</p>
                    </div>
                    <div className="mt-3 ml-10 space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selected === opt
                        const isAnswer = q.answer === opt
                        let optClass = 'border-slate-200 bg-white hover:bg-white'
                        if (isSelected && !showResult) optClass = 'border-brand-blue-500 bg-brand-blue-50'
                        if (showResult && isAnswer) optClass = 'border-green-500 bg-green-50'
                        if (showResult && isSelected && !isAnswer) optClass = 'border-red-400 bg-red-50'
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: opt }))}
                            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${optClass} ${
                              quizSubmitted ? 'cursor-default' : 'cursor-pointer'
                            }`}
                          >
                            <span className="font-medium text-slate-500 mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="text-slate-800">{opt}</span>
                            {showResult && isAnswer && (
                              <span className="ml-2 text-green-600 font-semibold">&#10003; Correct</span>
                            )}
                            {showResult && isSelected && !isAnswer && (
                              <span className="ml-2 text-red-600 font-semibold">&#10007; Incorrect</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!quizSubmitted && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < quiz.length}
                className="w-full py-3 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition text-lg"
              >
                {Object.keys(quizAnswers).length < quiz.length
                  ? `Answer all questions (${Object.keys(quizAnswers).length}/${quiz.length})`
                  : 'Submit Answers'}
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-6 rounded-xl border-2 p-5 text-center ${quizPassed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <div className="text-3xl mb-2">{quizPassed ? '\u2713' : '\u2717'}</div>
              <div className={`font-bold text-lg ${quizPassed ? 'text-green-800' : 'text-red-800'}`}>
                {quizPassed ? 'Quiz Passed!' : 'Quiz Not Passed'}
              </div>
              <p className={`text-sm mt-1 ${quizPassed ? 'text-green-700' : 'text-red-700'}`}>
                You scored {quizScore} out of {quiz.length}.
                {quizPassed ? '' : ' You need at least 4 correct. Review the material and try again.'}
              </p>
              {!quizPassed && (
                <button
                  type="button"
                  onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); scrollTo('quiz'); }}
                  className="mt-4 px-6 py-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold transition"
                >
                  Retry Quiz
                </button>
              )}
            </div>
          )}
        </section>

        {/* Module Complete */}
        {moduleComplete && (
          <section id="complete" className="scroll-mt-32">
            <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-8 text-center">
              <div className="text-4xl mb-3">&#10003;</div>
              <h2 className="text-2xl font-bold text-green-800">Module 1 Complete</h2>
              <p className="text-green-700 mt-2 max-w-lg mx-auto">
                You passed the knowledge check with {quizScore}/{quiz.length} correct.
                Module 1 is now marked complete in your training record.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold text-sm">
                Module Completed
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
