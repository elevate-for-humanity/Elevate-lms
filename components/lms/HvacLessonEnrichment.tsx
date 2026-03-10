'use client';

/**
 * Renders real teaching content for HVAC lessons from the TypeScript data files.
 * Injected into the lesson page when the course is HVAC and lesson_number is known.
 *
 * Replaces the placeholder "<h2>Lesson Overview</h2><p>description</p>" stored in
 * Supabase with actual instructional content: concept explanation, key terms,
 * job application, watch-for warnings, quiz questions, diagnostic exercises,
 * service scenarios, procedures, and EPA 608 study material.
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  BookOpen, Tag, Briefcase, AlertTriangle, ClipboardCheck,
  Wrench, ChevronDown, ChevronUp, CheckCircle, XCircle,
  Gauge, FlaskConical, FileText, ListOrdered, Brain, Layers,
  Timer, Thermometer, Trophy,
} from 'lucide-react';
import PTChartDrill from '@/components/lms/PTChartDrill';
import TimedPracticeExam, { type ExamQuestion } from '@/components/lms/TimedPracticeExam';
import SpacedRepetitionReview from '@/components/lms/SpacedRepetitionReview';
import UniversalPracticeExam from '@/components/lms/UniversalPracticeExam';
import LabHourTracker, { LAB_ACTIVITIES } from '@/components/lms/LabHourTracker';
import { HVAC_LESSON_CONTENT } from '@/lib/courses/hvac-lesson-content';
import { HVAC_QUIZ_BANKS } from '@/lib/courses/hvac-quiz-banks';
import { HVAC_SERVICE_SCENARIOS } from '@/lib/courses/hvac-service-scenarios';
import { getProceduresByModule } from '@/lib/courses/hvac-procedures';
import { GAUGE_READING_EXERCISES } from '@/lib/courses/hvac-diagnostic-exercises';
import { EPA608_STUDY_TOPICS } from '@/lib/courses/hvac-epa608-prep';
import { HVAC_LESSON_NUMBER_TO_DEF_ID, getModuleIdForLessonNumber } from '@/lib/courses/hvac-lesson-number-map';
import { CONDENSER_SCENARIOS } from '@/lib/simulations/condenser-scenarios';
import TroubleshootScenario from '@/components/lms/TroubleshootScenario';
import { SequenceOrder } from '@/components/lms/activities/SequenceOrder';
import { Pretest } from '@/components/lms/activities/Pretest';

// Diagrams are large SVG components — load lazily so they don't block the lesson
const HVACSystemOverview        = dynamic(() => import('@/components/hvac-diagrams/HVACSystemOverview'),        { ssr: false });
const RefrigerationCycleDiagram = dynamic(() => import('@/components/hvac-diagrams/RefrigerationCycleDiagram'), { ssr: false });
const CondenserBreakdownDiagram = dynamic(() => import('@/components/hvac-diagrams/CondenserBreakdownDiagram'), { ssr: false });
const FurnaceBreakdownDiagram   = dynamic(() => import('@/components/hvac-diagrams/FurnaceBreakdownDiagram'),   { ssr: false });
const ElectricalCircuitDiagram  = dynamic(() => import('@/components/hvac-diagrams/ElectricalCircuitDiagram'),  { ssr: false });
const ThermostatWiringDiagram   = dynamic(() => import('@/components/hvac-diagrams/ThermostatWiringDiagram'),   { ssr: false });
const DuctDistributionDiagram   = dynamic(() => import('@/components/hvac-diagrams/DuctDistributionDiagram'),   { ssr: false });
const TroubleshootingFlowchart  = dynamic(() => import('@/components/hvac-diagrams/TroubleshootingFlowchart'),  { ssr: false });
const EPA608Overview            = dynamic(() => import('@/components/hvac-diagrams/EPA608Overview'),            { ssr: false });
const OzoneDepletion            = dynamic(() => import('@/components/hvac-diagrams/OzoneDepletion'),            { ssr: false });
const ThreeRsDiagram            = dynamic(() => import('@/components/hvac-diagrams/ThreeRsDiagram'),            { ssr: false });
const RefrigerantTypesDiagram   = dynamic(() => import('@/components/hvac-diagrams/RefrigerantTypesDiagram'),   { ssr: false });
const EPA608PTChart             = dynamic(() => import('@/components/hvac-diagrams/EPA608PTChart'),             { ssr: false });
const TypeIRecoveryDiagram      = dynamic(() => import('@/components/hvac-diagrams/TypeIRecoveryDiagram'),      { ssr: false });
const TypeIILeakRepairDiagram   = dynamic(() => import('@/components/hvac-diagrams/TypeIILeakRepairDiagram'),   { ssr: false });
const TypeIIIChillerDiagram     = dynamic(() => import('@/components/hvac-diagrams/TypeIIIChillerDiagram'),     { ssr: false });

interface Props {
  lessonNumber: number;
  lessonTitle: string;
}

/* ── Small reusable pieces ── */

function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 ${color}`}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KeyTerms({ terms }: { terms: { term: string; definition: string }[] }) {
  if (!terms.length) return null;
  return (
    <Section icon={Tag} title="Key Terms" color="bg-brand-blue-50 text-brand-blue-800">
      <dl className="space-y-3">
        {terms.map((t) => (
          <div key={t.term}>
            <dt className="font-bold text-slate-900 text-sm">{t.term}</dt>
            <dd className="text-slate-600 text-sm mt-0.5 leading-relaxed">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function JobApplication({ text }: { text: string }) {
  return (
    <Section icon={Briefcase} title="On the Job" color="bg-brand-green-50 text-brand-green-800">
      <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
    </Section>
  );
}

function WatchFor({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <Section icon={AlertTriangle} title="Watch For" color="bg-amber-50 text-amber-800">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ── Quiz practice ── */

function QuizPractice({ moduleId }: { moduleId: string }) {
  const questions = HVAC_QUIZ_BANKS[moduleId];
  if (!questions?.length) return null;

  const [selected, setSelected] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const choose = (qi: number, oi: number) => {
    if (revealed[qi]) return;
    setSelected((s) => ({ ...s, [qi]: oi }));
  };

  const reveal = (qi: number) => setRevealed((r) => ({ ...r, [qi]: true }));

  const score = Object.keys(revealed).filter(
    (qi) => selected[Number(qi)] === questions[Number(qi)].answer
  ).length;
  const attempted = Object.keys(revealed).length;

  return (
    <Section icon={ClipboardCheck} title="Knowledge Check" color="bg-slate-50 text-slate-800">
      <div className="space-y-6">
        {attempted > 0 && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg px-4 py-2">
            <CheckCircle className="w-4 h-4 text-brand-green-600" />
            {score}/{attempted} correct so far
          </div>
        )}

        {questions.map((q, qi) => {
          const isRevealed = revealed[qi];
          const userAnswer = selected[qi];
          const isCorrect = userAnswer === q.answer;

          return (
            <div key={qi} className="border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-slate-900 text-sm mb-3">
                {qi + 1}. {q.question}
              </p>

              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  let cls = 'border border-slate-200 text-slate-700 hover:bg-slate-50';
                  if (isRevealed) {
                    if (oi === q.answer) cls = 'border-brand-green-400 bg-brand-green-50 text-brand-green-800 font-semibold';
                    else if (oi === userAnswer && !isCorrect) cls = 'border-red-300 bg-red-50 text-red-700';
                    else cls = 'border-slate-100 text-slate-400';
                  } else if (userAnswer === oi) {
                    cls = 'border-brand-blue-400 bg-brand-blue-50 text-brand-blue-800';
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => choose(qi, oi)}
                      disabled={isRevealed}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${cls} disabled:cursor-default`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {userAnswer !== undefined && !isRevealed && (
                <button
                  onClick={() => reveal(qi)}
                  className="mt-3 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                >
                  Check answer
                </button>
              )}

              {isRevealed && (
                <div className={`mt-3 flex gap-2 text-sm rounded-lg px-4 py-3 ${isCorrect ? 'bg-brand-green-50 text-brand-green-800' : 'bg-red-50 text-red-800'}`}>
                  {isCorrect
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Gauge reading exercise ── */

function GaugeExercise({ moduleId }: { moduleId: string }) {
  const exercises = GAUGE_READING_EXERCISES.filter((e) => {
    // Show exercises relevant to this module
    const modNum = parseInt(moduleId.replace('hvac-', ''), 10);
    if (modNum === 5 || modNum === 8) return e.difficulty === 'beginner';
    if (modNum === 13) return true;
    return false;
  });
  if (!exercises.length) return null;

  const [open, setOpen] = useState<string | null>(null);

  return (
    <Section icon={Gauge} title="Gauge Reading Practice" color="bg-indigo-50 text-indigo-800">
      <p className="text-sm text-slate-600 mb-4">
        Real system readings. Diagnose the problem before revealing the answer.
      </p>
      <div className="space-y-4">
        {exercises.slice(0, 3).map((ex) => (
          <div key={ex.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === ex.id ? null : ex.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition"
            >
              <div>
                <p className="font-semibold text-slate-900 text-sm">{ex.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ex.refrigerant} · {ex.systemType} · {ex.difficulty}</p>
              </div>
              {open === ex.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {open === ex.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
                {/* Conditions */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Outdoor Temp</p>
                    <p className="font-bold text-slate-900">{ex.outdoorTemp}°F</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Indoor Temp</p>
                    <p className="font-bold text-slate-900">{ex.indoorTemp}°F</p>
                  </div>
                </div>

                {/* Gauge readings */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-brand-blue-50 rounded-lg p-3 border border-brand-blue-200">
                    <p className="text-xs font-bold text-brand-blue-600 uppercase mb-1">Low Side (Suction)</p>
                    <p className="font-bold text-brand-blue-900 text-lg">{ex.suctionPressure} psig</p>
                    <p className="text-xs text-brand-blue-700 mt-1">Sat temp: {ex.suctionSatTemp}°F</p>
                    <p className="text-xs text-brand-blue-700">Line temp: {ex.suctionLineTemp}°F</p>
                    <p className="text-xs font-bold text-brand-blue-800 mt-1">Superheat: {ex.superheat}°F</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">High Side (Discharge)</p>
                    <p className="font-bold text-red-900 text-lg">{ex.dischargePressure} psig</p>
                    <p className="text-xs text-red-700 mt-1">Sat temp: {ex.liquidSatTemp}°F</p>
                    <p className="text-xs text-red-700">Line temp: {ex.liquidLineTemp}°F</p>
                    <p className="text-xs font-bold text-red-800 mt-1">Subcooling: {ex.subcooling}°F</p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-700">What is the diagnosis?</p>

                <details className="group">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700 list-none [&::-webkit-details-marker]:hidden">
                    Reveal diagnosis →
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-brand-green-700 uppercase mb-1">Diagnosis</p>
                      <p className="text-sm text-brand-green-900 font-semibold">{ex.diagnosis}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Explanation</p>
                      <p className="text-sm text-slate-700">{ex.explanation}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-amber-700 uppercase mb-1">Correct Action</p>
                      <p className="text-sm text-amber-900">{ex.correctAction}</p>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── Service scenario ── */

function ServiceScenarios({ moduleId }: { moduleId: string }) {
  const scenarios = HVAC_SERVICE_SCENARIOS.filter((s) => s.moduleIds.includes(moduleId));
  if (!scenarios.length) return null;

  const [open, setOpen] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState<string | null>(null);

  return (
    <Section icon={FlaskConical} title="Service Call Scenarios" color="bg-purple-50 text-purple-800">
      <p className="text-sm text-slate-600 mb-4">
        Work through these calls the way you would on the job. Try to diagnose before revealing the answer.
      </p>
      <div className="space-y-4">
        {scenarios.slice(0, 2).map((sc) => (
          <div key={sc.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === sc.id ? null : sc.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition"
            >
              <div>
                <p className="font-semibold text-slate-900 text-sm">{sc.complaint}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sc.conditions} · {sc.difficulty}</p>
              </div>
              {open === sc.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {open === sc.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">System Info</p>
                  {sc.systemInfo}
                </div>

                {/* Diagnostic steps */}
                <div>
                  <button
                    onClick={() => setShowSteps(showSteps === sc.id ? null : sc.id)}
                    className="text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    {showSteps === sc.id ? 'Hide' : 'Show'} diagnostic steps →
                  </button>

                  {showSteps === sc.id && (
                    <ol className="mt-3 space-y-2">
                      {sc.diagnosticSteps.map((step, i) => (
                        <li key={i} className={`flex gap-3 text-sm rounded-lg p-3 ${step.isKeyFinding ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.isKeyFinding ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{step.action}</p>
                            <p className="text-slate-600 mt-0.5">{step.finding}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Root cause reveal */}
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700 list-none [&::-webkit-details-marker]:hidden">
                    Reveal root cause & repair →
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-brand-green-700 uppercase mb-1">Root Cause</p>
                      <p className="text-sm text-brand-green-900">{sc.rootCause}</p>
                    </div>
                    <div className="bg-brand-blue-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-brand-blue-700 uppercase mb-1">Correct Repair</p>
                      <p className="text-sm text-brand-blue-900">{sc.correctRepair}</p>
                    </div>
                    {sc.commonMistakes.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-700 uppercase mb-1">Common Mistakes</p>
                        <ul className="space-y-1">
                          {sc.commonMistakes.map((m, i) => (
                            <li key={i} className="text-sm text-red-800 flex gap-2">
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── Procedure reference ── */

function ProcedureReference({ moduleId }: { moduleId: string }) {
  const procedures = getProceduresByModule(moduleId);
  if (!procedures.length) return null;

  return (
    <Section icon={FileText} title="Step-by-Step Procedures" color="bg-teal-50 text-teal-800">
      <div className="space-y-4">
        {procedures.slice(0, 2).map((proc) => (
          <details key={proc.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition list-none [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{proc.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{proc.whenToPerform}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </summary>
            <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tools Required</p>
                <div className="flex flex-wrap gap-1.5">
                  {proc.toolsRequired.map((t) => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <ol className="space-y-2">
                {proc.steps.map((step) => (
                  <li key={step.step} className={`flex gap-3 text-sm rounded-lg p-3 ${step.warning ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{step.action}</p>
                      <p className="text-slate-600 mt-0.5">{step.detail}</p>
                      {step.warning && (
                        <p className="text-amber-700 font-semibold mt-1 text-xs">⚠ {step.warning}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {proc.commonMistakes.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 uppercase mb-2">Common Mistakes</p>
                  <ul className="space-y-1">
                    {proc.commonMistakes.map((m, i) => (
                      <li key={i} className="text-sm text-red-800 flex gap-2">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ── EPA 608 study topics ── */

function EPA608StudySection({ moduleId }: { moduleId: string }) {
  const modNum = parseInt(moduleId.replace('hvac-', ''), 10);
  // Only show for modules 6-9 (EPA 608 content)
  if (modNum < 6 || modNum > 9) return null;

  const sectionMap: Record<number, 'core' | 'type1' | 'type2' | 'type3'> = {
    6: 'core', 7: 'type1', 8: 'type2', 9: 'type3',
  };
  const section = sectionMap[modNum];
  const topics = EPA608_STUDY_TOPICS.filter((t) => t.section === section);
  if (!topics.length) return null;

  return (
    <Section icon={BookOpen} title="EPA 608 Study Guide" color="bg-brand-orange-50 text-brand-orange-800">
      <div className="space-y-4">
        {topics.slice(0, 4).map((topic) => (
          <details key={topic.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  topic.examWeight === 'high' ? 'bg-red-100 text-red-700' :
                  topic.examWeight === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {topic.examWeight === 'high' ? 'HIGH PRIORITY' : topic.examWeight === 'medium' ? 'MEDIUM' : 'LOW'}
                </span>
                <p className="font-semibold text-slate-900 text-sm">{topic.title}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </summary>
            <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">{topic.content}</p>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Key Facts to Memorize</p>
                <ul className="space-y-1.5">
                  {topic.keyFacts.map((fact, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════
   Interactive Diagram Lab
   Each module gets the diagram that matches what it teaches.
   Students go explore → quiz → review in sequence.
   ══════════════════════════════════════════════════════════════ */

type DiagramMode = 'explore' | 'quiz' | 'review';

// Which diagram to show per module, and what the lab is called
const MODULE_DIAGRAMS: Record<string, {
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}> = {
  'hvac-02': {
    title: 'HVAC System Overview',
    description: 'Click each component to learn what it does and how to diagnose it.',
    component: HVACSystemOverview,
  },
  'hvac-03': {
    title: 'Electrical Control Circuit',
    description: 'Trace the 24V control circuit. Click each component to see its function and failure modes.',
    component: ElectricalCircuitDiagram,
  },
  'hvac-04': {
    title: 'Gas Furnace Breakdown',
    description: 'Click each furnace component to understand its role in the heating sequence.',
    component: FurnaceBreakdownDiagram,
  },
  'hvac-05': {
    title: 'Refrigeration Cycle',
    description: 'Follow the refrigerant through all four stages. Click each stage to see what happens to pressure, temperature, and state.',
    component: RefrigerationCycleDiagram,
  },
  'hvac-08': {
    title: 'Condenser Unit Breakdown',
    description: 'Click each component inside the condenser. Know what it does before you touch it on a service call.',
    component: CondenserBreakdownDiagram,
  },
  'hvac-10': {
    title: 'Duct Distribution System',
    description: 'Trace airflow from the air handler through supply and return ducts. Click each section to see sizing rules and common problems.',
    component: DuctDistributionDiagram,
  },
  'hvac-11': {
    title: 'Thermostat Wiring',
    description: 'Click each wire terminal to learn what it controls. Know this before you wire any thermostat.',
    component: ThermostatWiringDiagram,
  },
  'hvac-13': {
    title: 'Troubleshooting Flowchart',
    description: 'Work through a no-cool call step by step. Click each decision point to see the diagnostic logic.',
    component: TroubleshootingFlowchart,
  },
  'hvac-06': {
    title: 'EPA 608 Certification Structure',
    description: 'Tap each section to learn what it covers, how many questions, and what equipment it applies to.',
    component: EPA608Overview,
  },
  'hvac-06-02': {
    title: 'How Chlorine Destroys Ozone',
    description: 'Step through the chain reaction that led to the Montreal Protocol and the CFC ban.',
    component: OzoneDepletion,
  },
  'hvac-06-03': {
    title: 'Refrigerant Families — CFC, HCFC, HFC, HFO',
    description: 'Compare ODP, GWP, phase-out status, and common refrigerants across all four families.',
    component: RefrigerantTypesDiagram,
  },
  'hvac-06-04': {
    title: 'The Three R\'s — Recover, Recycle, Reclaim',
    description: 'Tap each R to see the exact legal definition, equipment used, and what you can and cannot do.',
    component: ThreeRsDiagram,
  },
  'hvac-06-07': {
    title: 'P/T Chart Drill',
    description: 'Enter a pressure reading, get the saturation temperature, and calculate superheat or subcooling.',
    component: EPA608PTChart,
  },
  'hvac-07': {
    title: 'Type I Recovery Decision Tree',
    description: 'Work through the decision tree for any small appliance recovery scenario.',
    component: TypeIRecoveryDiagram,
  },
  'hvac-08': {
    title: 'Type II — Leak Repair, Evacuation, Charging',
    description: 'The three most tested Type II topics with interactive tabs and quiz questions.',
    component: TypeIILeakRepairDiagram,
  },
  'hvac-09': {
    title: 'Type III — Centrifugal Chillers',
    description: 'Low-pressure systems, purge units, pressurization leak testing, and ASHRAE 15.',
    component: TypeIIIChillerDiagram,
  },
  'hvac-16': {
    title: 'Full System Review',
    description: 'Capstone review — identify every component across the full refrigeration cycle.',
    component: RefrigerationCycleDiagram,
  },
};

const MODE_LABELS: Record<DiagramMode, string> = {
  explore: 'Explore',
  quiz: 'Quiz Me',
  review: 'Review',
};

const MODE_DESCRIPTIONS: Record<DiagramMode, string> = {
  explore: 'Click any component to learn what it does.',
  quiz: 'Components are hidden. Identify each one.',
  review: 'Everything revealed — use this to study.',
};

function InteractiveDiagramLab({ moduleId }: { moduleId: string }) {
  const config = MODULE_DIAGRAMS[moduleId];
  if (!config) return null;

  const [mode, setMode] = useState<DiagramMode>('explore');
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [reviewUnlocked, setReviewUnlocked] = useState(false);

  const DiagramComponent = config.component;

  return (
    <Section icon={Layers} title={`Interactive Lab — ${config.title}`} color="bg-brand-blue-50 text-brand-blue-900">
      <p className="text-sm text-slate-600 mb-4">{config.description}</p>

      {/* Mode selector */}
      <div className="flex gap-2 mb-5">
        {(['explore', 'quiz', 'review'] as DiagramMode[]).map((m) => {
          const locked = (m === 'quiz' && !quizUnlocked) || (m === 'review' && !reviewUnlocked);
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => {
                if (locked) return;
                setMode(m);
              }}
              disabled={locked}
              title={locked ? 'Complete the previous mode to unlock' : MODE_DESCRIPTIONS[m]}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                active
                  ? 'bg-brand-blue-600 text-white border-brand-blue-600'
                  : locked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-brand-blue-300 hover:text-brand-blue-700'
              }`}
            >
              {locked ? '🔒 ' : ''}{MODE_LABELS[m]}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mb-4 italic">{MODE_DESCRIPTIONS[mode]}</p>

      {/* The diagram */}
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
        <DiagramComponent
          mode={mode}
          onComplete={() => {
            if (mode === 'explore') { setQuizUnlocked(true); setMode('quiz'); }
            if (mode === 'quiz')    { setReviewUnlocked(true); setMode('review'); }
          }}
        />
      </div>

      {/* Unlock hints */}
      {mode === 'explore' && !quizUnlocked && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Click through all components to unlock Quiz mode.
        </p>
      )}
      {mode === 'quiz' && !reviewUnlocked && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Complete the quiz to unlock Review mode.
        </p>
      )}
      {mode === 'review' && (
        <p className="text-xs text-brand-green-600 font-semibold mt-3 text-center">
          ✅ Lab complete — you've explored, been tested, and reviewed this system.
        </p>
      )}
    </Section>
  );
}

/* ── Pretest — fires before the lesson to activate prior knowledge ── */

// Per-module pretest questions keyed to what the lesson actually teaches
const MODULE_PRETESTS: Record<string, { question: string; options: string[]; answer: number; hint: string }[]> = {
  'hvac-02': [
    { question: 'Where does heat go when an AC system cools your house?', options: ['It disappears', 'It moves outside', 'It turns into cold air', 'It goes into the walls'], answer: 1, hint: 'Refrigerant is a heat mover, not a heat destroyer. It picks up heat inside and drops it off outside.' },
    { question: 'What does the compressor do?', options: ['Cools the refrigerant', 'Pumps refrigerant by compressing it', 'Filters the air', 'Controls the thermostat'], answer: 1, hint: 'Think of it like a pump for refrigerant — it squeezes the gas to raise its pressure and temperature.' },
  ],
  'hvac-03': [
    { question: 'What happens to current when resistance increases (voltage stays the same)?', options: ['Current increases', 'Current decreases', 'Current stays the same', 'Voltage drops to zero'], answer: 1, hint: "Ohm's Law: V = I × R. If R goes up and V stays fixed, I must go down." },
    { question: 'A capacitor reads 5 µF but is rated 45 µF. What do you do?', options: ['Leave it — close enough', 'Replace it', 'Add more capacitors in parallel', 'Increase the voltage'], answer: 1, hint: 'Tolerance is ±6%. 5 µF on a 45 µF cap is an 89% drop — it has failed.' },
  ],
  'hvac-04': [
    { question: 'What separates combustion gases from the air you breathe in a furnace?', options: ['The blower motor', 'The heat exchanger', 'The gas valve', 'The flue pipe'], answer: 1, hint: 'A cracked heat exchanger is a CO hazard — it lets combustion gases mix with supply air.' },
    { question: 'What does a flame sensor do if it cannot detect a flame?', options: ['Keeps the gas valve open', 'Shuts the gas valve', 'Turns on the blower', 'Resets the thermostat'], answer: 1, hint: 'Safety first — if the sensor cannot prove flame within a few seconds, gas shuts off to prevent a buildup.' },
  ],
  'hvac-05': [
    { question: 'High superheat on a TXV system most likely means:', options: ['Overcharged system', 'Not enough refrigerant reaching the evaporator', 'Dirty condenser coil', 'Bad compressor'], answer: 1, hint: 'Superheat measures how much the vapor has heated above boiling. High superheat = evaporator is starved.' },
    { question: 'What does subcooling measure?', options: ['How cold the suction line is', 'How far the liquid has cooled below its condensing temperature', 'The temperature of the outdoor air', 'Compressor discharge temperature'], answer: 1, hint: 'Subcooling tells you how much liquid refrigerant is stacked up in the condenser. Low subcooling = low charge.' },
  ],
  'hvac-06': [
    { question: 'What is the maximum fine for knowingly venting refrigerant?', options: ['$1,000', '$10,000', '$44,539 per day', '$500'], answer: 2, hint: 'The Clean Air Act penalty was updated — it is now $44,539 per day per violation. This is not a small fine.' },
    { question: 'R-410A has zero ODP. What does ODP stand for?', options: ['Operating Discharge Pressure', 'Ozone Depletion Potential', 'Outdoor Design Parameter', 'Oil Dilution Percentage'], answer: 1, hint: 'ODP measures how much a refrigerant destroys stratospheric ozone. R-22 has ODP of 0.05. R-410A has 0.' },
  ],
  'hvac-13': [
    { question: 'A condenser fan is not spinning but the compressor is humming. First thing you check?', options: ['Refrigerant charge', 'Run capacitor', 'Thermostat wiring', 'Ductwork'], answer: 1, hint: 'Fan not spinning + compressor running = capacitor failure until proven otherwise. It is the most common cause.' },
    { question: 'You measure 240V at the contactor line side but 0V at the load side. What is the problem?', options: ['Bad compressor', 'Bad contactor', 'Low refrigerant', 'Tripped breaker'], answer: 1, hint: 'Voltage in, no voltage out = the contactor is not closing. Check the coil voltage and the contacts.' },
  ],
};

function LessonPretest({ moduleId }: { moduleId: string }) {
  const questions = MODULE_PRETESTS[moduleId];
  if (!questions?.length) return null;
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <Section icon={Brain} title="Before You Start — What Do You Already Know?" color="bg-indigo-50 text-indigo-800">
      <p className="text-sm text-slate-600 mb-4">
        Not graded. These questions prime your brain for what's coming. Answer honestly — the hints explain the concept.
      </p>
      <Pretest
        title=""
        questions={questions}
        onComplete={() => setDone(true)}
      />
    </Section>
  );
}

/* ── TroubleshootScenario wrapper — uses real condenser fault data ── */

// Which modules get the interactive troubleshoot simulator
const TROUBLESHOOT_MODULES = new Set(['hvac-05', 'hvac-08', 'hvac-13', 'hvac-14', 'hvac-16']);

function TroubleshootLab({ moduleId }: { moduleId: string }) {
  if (!TROUBLESHOOT_MODULES.has(moduleId)) return null;
  // Filter by difficulty based on module
  const modNum = parseInt(moduleId.replace('hvac-', ''), 10);
  const difficulty: 'guided' | 'practice' | 'challenge' =
    modNum <= 8 ? 'guided' : modNum <= 13 ? 'practice' : 'challenge';
  const scenarios = CONDENSER_SCENARIOS.filter((s) => s.difficulty === difficulty || s.difficulty === 'guided');
  if (!scenarios.length) return null;
  return (
    <Section icon={Gauge} title="Fault Diagnosis Simulator" color="bg-rose-50 text-rose-800">
      <p className="text-sm text-slate-600 mb-4">
        Real gauge readings from a broken system. Read the numbers, identify the fault.
      </p>
      <TroubleshootScenario
        scenarios={scenarios}
        equipmentLabel="Split-System AC"
        forceDifficulty={difficulty}
      />
    </Section>
  );
}

/* ── SequenceOrder — put procedure steps in the right order ── */

// Procedure step sequences per module for the ordering activity
const MODULE_SEQUENCES: Record<string, { label: string; explanation: string }[]> = {
  'hvac-07': [
    { label: 'Identify the refrigerant type from the nameplate', explanation: 'Never assume — mixing refrigerants in a recovery cylinder is illegal and dangerous.' },
    { label: 'Weigh the recovery cylinder — note tare weight and 80% capacity', explanation: 'Overfilling above 80% risks hydrostatic rupture from liquid expansion.' },
    { label: 'Connect hoses: system → recovery machine → recovery cylinder', explanation: 'Correct flow direction prevents refrigerant from going the wrong way.' },
    { label: 'Open cylinder valve, start recovery machine', explanation: 'Open the cylinder first so the machine has somewhere to push the refrigerant.' },
    { label: 'Monitor scale — stop before 80% capacity', explanation: 'The scale is your safety check. Do not rely on guessing.' },
    { label: 'Close cylinder valve, stop machine, disconnect hoses', explanation: 'Close the cylinder first to prevent backflow when you stop the machine.' },
    { label: 'Label the cylinder with refrigerant type, date, and amount', explanation: 'Unlabeled cylinders are a violation and a safety hazard.' },
  ],
  'hvac-08': [
    { label: 'Remove Schrader valve cores from both service ports', explanation: 'Cores restrict flow — removing them cuts evacuation time dramatically.' },
    { label: 'Connect vacuum pump to center hose, micron gauge at the system', explanation: 'Gauge at the system (not the pump) gives an accurate reading of actual vacuum.' },
    { label: 'Open both manifold valves fully', explanation: 'Both sides must be open so the pump pulls from the entire system.' },
    { label: 'Start vacuum pump — pull to 500 microns or below', explanation: '500 microns removes enough moisture to prevent acid formation in the system.' },
    { label: 'Close manifold valves, turn off pump — decay test for 10 minutes', explanation: 'If vacuum rises above 1000 microns, you have a leak or moisture. Do not charge yet.' },
    { label: 'Reinstall Schrader cores', explanation: 'Cores must be back in before you charge — otherwise refrigerant escapes through the ports.' },
    { label: 'Break vacuum with refrigerant and charge to spec', explanation: 'Break vacuum with refrigerant, not nitrogen — nitrogen does not condense and will affect readings.' },
  ],
  'hvac-04': [
    { label: 'Thermostat calls for heat — draft inducer starts', explanation: 'The inducer runs first to purge the heat exchanger of any residual gas before ignition.' },
    { label: 'Pressure switch closes — proves inducer is running', explanation: 'The pressure switch is a safety — if the inducer fails, the switch stays open and gas never flows.' },
    { label: 'Hot surface igniter energizes — heats to 1800°F+', explanation: 'Silicon nitride igniters glow orange-white. They are fragile — never touch with bare hands.' },
    { label: 'Gas valve opens — burners ignite', explanation: 'Gas valve only opens after the igniter is proven hot. Sequence prevents raw gas buildup.' },
    { label: 'Flame sensor proves flame — keeps gas valve open', explanation: 'The sensor passes a small current through the flame. No flame = no current = gas valve closes in seconds.' },
    { label: 'Heat exchanger warms — blower delay timer counts down', explanation: 'Blower delay prevents cold air from blowing before the heat exchanger is warm.' },
    { label: 'Blower starts — warm air flows through supply ducts', explanation: 'Blower runs until the heat exchanger cools down after the call for heat ends.' },
  ],
};

function ProcedureSequence({ moduleId }: { moduleId: string }) {
  const steps = MODULE_SEQUENCES[moduleId];
  if (!steps?.length) return null;
  const titles: Record<string, string> = {
    'hvac-07': 'Put the refrigerant recovery procedure in the correct order',
    'hvac-08': 'Put the system evacuation procedure in the correct order',
    'hvac-04': 'Put the gas furnace startup sequence in the correct order',
  };
  return (
    <Section icon={ListOrdered} title="Procedure Sequencing" color="bg-teal-50 text-teal-800">
      <p className="text-sm text-slate-600 mb-4">
        Drag or use the arrows to put these steps in the correct order. Order matters on the job.
      </p>
      <SequenceOrder
        title={titles[moduleId] ?? 'Put these steps in the correct order'}
        steps={steps}
      />
    </Section>
  );
}

/* ── PT Chart Drill — EPA modules 5-9 ── */

// Modules that cover refrigerant properties and EPA 608 content
const PT_DRILL_MODULES = new Set(['hvac-05', 'hvac-06', 'hvac-07', 'hvac-08', 'hvac-09']);

function PTChartSection({ moduleId }: { moduleId: string }) {
  if (!PT_DRILL_MODULES.has(moduleId)) return null;
  return (
    <Section icon={Thermometer} title="PT Chart Drill" color="bg-cyan-50 text-cyan-800">
      <p className="text-sm text-slate-600 mb-4">
        On the real EPA 608 exam you need to read a PT chart quickly and accurately.
        Practice until you can answer in under 5 seconds.
      </p>
      <PTChartDrill />
    </Section>
  );
}

/* ── Timed Practice Exam — EPA modules 6-9 ── */

// Section names for each EPA module
const EPA_SECTION_NAMES: Record<string, string> = {
  'hvac-06': 'Core',
  'hvac-07': 'Type I — Small Appliances',
  'hvac-08': 'Type II — High-Pressure',
  'hvac-09': 'Type III — Low-Pressure',
};

function TimedExamSection({ moduleId }: { moduleId: string }) {
  const sectionName = EPA_SECTION_NAMES[moduleId];
  if (!sectionName) return null;

  // Pull questions from the quiz bank for this module
  const rawQuestions = HVAC_QUIZ_BANKS[moduleId] ?? [];
  if (rawQuestions.length < 10) return null; // not enough questions yet

  // Normalize to ExamQuestion shape (quiz bank uses same shape)
  const questions: ExamQuestion[] = rawQuestions.map((q) => ({
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  }));

  return (
    <Section icon={Timer} title={`Timed Practice Exam — EPA 608 ${sectionName}`} color="bg-brand-orange-50 text-brand-orange-800">
      <p className="text-sm text-slate-600 mb-4">
        Mirrors the real ESCO exam: 25 questions, 30 minutes, 70% to pass.
        Missed questions are saved for spaced repetition review.
      </p>
      <TimedPracticeExam
        questions={questions}
        sectionName={sectionName}
        timeMinutes={30}
        passingScore={70}
      />
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main export
   ══════════════════════════════════════════════════════════════ */

export default function HvacLessonEnrichment({ lessonNumber, lessonTitle }: Props) {
  const defId = HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNumber];
  const moduleId = getModuleIdForLessonNumber(lessonNumber);

  if (!defId && !moduleId) return null;

  const lessonContent = defId ? HVAC_LESSON_CONTENT[defId] : null;

  return (
    <div className="space-y-5">
      {/* Spaced repetition — shows missed questions due for review */}
      <SpacedRepetitionReview />

      {/* Pretest — activates prior knowledge before the lesson */}
      {moduleId && <LessonPretest moduleId={moduleId} />}

      {/* Concept explanation */}
      {lessonContent?.concept && (
        <Section icon={BookOpen} title="What You're Learning" color="bg-slate-50 text-slate-800">
          <p className="text-slate-700 text-sm leading-relaxed">{lessonContent.concept}</p>
        </Section>
      )}

      {/* Interactive diagram lab — explore the system before reading about it */}
      {moduleId && <InteractiveDiagramLab moduleId={moduleId} />}

      {/* Key terms */}
      {lessonContent?.keyTerms && lessonContent.keyTerms.length > 0 && (
        <KeyTerms terms={lessonContent.keyTerms} />
      )}

      {/* Job application */}
      {lessonContent?.jobApplication && (
        <JobApplication text={lessonContent.jobApplication} />
      )}

      {/* Watch for */}
      {lessonContent?.watchFor && lessonContent.watchFor.length > 0 && (
        <WatchFor items={lessonContent.watchFor} />
      )}

      {/* EPA 608 study topics (modules 6-9) */}
      {moduleId && <EPA608StudySection moduleId={moduleId} />}

      {/* PT chart drill (modules 5-9) */}
      {moduleId && <PTChartSection moduleId={moduleId} />}

      {/* Procedure sequencing activity */}
      {moduleId && <ProcedureSequence moduleId={moduleId} />}

      {/* Procedures reference */}
      {moduleId && <ProcedureReference moduleId={moduleId} />}

      {/* Gauge reading exercises */}
      {moduleId && <GaugeExercise moduleId={moduleId} />}

      {/* Fault diagnosis simulator */}
      {moduleId && <TroubleshootLab moduleId={moduleId} />}

      {/* Service scenarios */}
      {moduleId && <ServiceScenarios moduleId={moduleId} />}

      {/* Knowledge check quiz */}
      {moduleId && <QuizPractice moduleId={moduleId} />}

      {/* Timed practice exam (EPA modules 6-9) — after the knowledge check */}
      {moduleId && <TimedExamSection moduleId={moduleId} />}

      {/* Lab hour tracker — compact on lab lessons, full tracker on capstone */}
      {defId && LAB_ACTIVITIES.some(a => a.id === defId) && (
        <Section icon={ClipboardCheck} title="Log Your Lab Hours" color="bg-teal-50 text-teal-800">
          <p className="text-sm text-slate-600 mb-4">
            Log your hands-on time for this lab. Your instructor must initial each session.
            70 total lab hours are required for EPA 608 eligibility.
          </p>
          <LabHourTracker activityId={defId} compact />
        </Section>
      )}
      {moduleId === 'hvac-16' && (
        <Section icon={ClipboardCheck} title="Lab Hour Summary" color="bg-teal-50 text-teal-800">
          <p className="text-sm text-slate-600 mb-4">
            Your complete lab hour log. Export as CSV for your instructor or ETPL documentation.
          </p>
          <LabHourTracker />
        </Section>
      )}

      {/* Universal combined exam — final lesson of module 9 and module 16 capstone */}
      {(defId === 'hvac-09-06' || moduleId === 'hvac-16') && (
        <Section icon={Trophy} title="EPA 608 Universal Practice Exam — All 4 Sections" color="bg-brand-blue-50 text-brand-blue-900">
          <p className="text-sm text-slate-600 mb-4">
            This is the full 100-question Universal mock exam. You must score 70%+ on each of the 4 sections
            to earn Universal certification — the same requirement as the real ESCO exam.
          </p>
          <UniversalPracticeExam />
        </Section>
      )}
    </div>
  );
}
