'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Video,
  FlaskConical,
  ClipboardList,
  CheckCircle,
  Lock,
  Menu,
  X,
  GraduationCap,
  Wrench,
  Eye,
} from 'lucide-react';
import { COURSE_DEFINITIONS } from '@/lib/courses/definitions';
import InteractiveVideoPlayer from '@/components/lms/InteractiveVideoPlayer';
import { PostVideoQuiz } from '@/components/lms/PostVideoQuiz';
import TroubleshootScenario from '@/components/lms/TroubleshootScenario';
import CondenserDiagram from '@/components/hvac-labs/CondenserDiagram';
import GaugeReadingLab from '@/components/hvac-labs/GaugeReadingLab';
import EPA608PracticeExam from '@/components/hvac-labs/EPA608PracticeExam';
import ComponentIDLab from '@/components/hvac-labs/ComponentIDLab';
import { CONDENSER_SCENARIOS } from '@/lib/simulations/condenser-scenarios';
import { HVAC_QUIZ_BANKS } from '@/lib/courses/hvac-quiz-banks';
import { HVAC_MODULE_CONTENT } from '@/lib/courses/hvac-module-content';
import { getModuleDiagrams } from '@/lib/courses/hvac-visual-library';
import { getModuleEquipment } from '@/lib/courses/hvac-equipment-models';
import { getModuleScenarios } from '@/lib/courses/hvac-service-scenarios';
import {
  RefrigerationCycleDiagram,
  CondenserBreakdownDiagram,
  ThermostatWiringDiagram,
  HVACSystemOverview,
  FurnaceBreakdownDiagram,
  ElectricalCircuitDiagram,
  DuctDistributionDiagram,
  TroubleshootingFlowchart,
} from '@/components/hvac-diagrams';

const course = COURSE_DEFINITIONS.find((c) => c.slug === 'hvac-technician')!;

type TabId = 'video' | 'content' | 'lab' | 'quiz';

const TABS: { id: TabId; label: string; icon: typeof Video }[] = [
  { id: 'content', label: 'Content', icon: BookOpen },
  { id: 'lab', label: 'Lab', icon: FlaskConical },
  { id: 'quiz', label: 'Quiz', icon: ClipboardList },
  { id: 'video', label: 'Video', icon: Video },
];

// All modules have labs — interactive components mapped by module
const LAB_MODULES = [
  'hvac-01', 'hvac-02', 'hvac-03', 'hvac-04', 'hvac-05', 'hvac-06',
  'hvac-07', 'hvac-08', 'hvac-09', 'hvac-10', 'hvac-11', 'hvac-12',
  'hvac-13', 'hvac-14', 'hvac-15', 'hvac-16',
];

/** Map diagram IDs to their interactive components */
const DIAGRAM_COMPONENTS: Record<string, React.ReactNode> = {
  'hvac-system-overview': <HVACSystemOverview />,
  'refrigeration-cycle': <RefrigerationCycleDiagram />,
  'condenser-breakdown': <CondenserBreakdownDiagram />,
  'furnace-breakdown': <FurnaceBreakdownDiagram />,
  'thermostat-wiring': <ThermostatWiringDiagram />,
  'control-circuit': <ElectricalCircuitDiagram />,
  'duct-distribution': <DuctDistributionDiagram />,
  'troubleshooting-flowchart': <TroubleshootingFlowchart />,
};

function ServiceCallCard({ scenario }: { scenario: ReturnType<typeof getModuleScenarios>[number] }) {
  const [expanded, setExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
              scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-700'
                : scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {scenario.difficulty}
            </span>
            <h4 className="font-bold text-slate-900 mt-2">&ldquo;{scenario.complaint}&rdquo;</h4>
            <p className="text-sm text-slate-500 mt-1">{scenario.conditions}</p>
          </div>
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">System Info</p>
            <p className="text-sm text-slate-700">{scenario.systemInfo}</p>
          </div>

          {!showAnswer ? (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Diagnostic Steps</h4>
              <p className="text-sm text-slate-600">Follow each step. What would you check next?</p>
              {scenario.diagnosticSteps.slice(0, currentStep + 1).map((step, i) => (
                <div key={i} className={`rounded-lg p-4 border ${step.isKeyFinding ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                  <p className="text-sm font-semibold text-slate-800">Step {i + 1}: {step.action}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-medium">Finding:</span> {step.finding}
                  </p>
                  {step.isKeyFinding && (
                    <p className="text-xs font-bold text-yellow-700 mt-1">⚡ Key Finding</p>
                  )}
                </div>
              ))}
              {currentStep < scenario.diagnosticSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="w-full py-2.5 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition text-sm"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-2.5 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition text-sm"
                >
                  Reveal Diagnosis & Repair
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Root Cause</p>
                <p className="text-sm text-slate-800">{scenario.rootCause}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Correct Repair</p>
                <p className="text-sm text-slate-800">{scenario.correctRepair}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-bold text-red-700 uppercase mb-1">Common Mistakes</p>
                <ul className="space-y-1 mt-1">
                  {scenario.commonMistakes.map((m, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-500 flex-shrink-0">✗</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => { setShowAnswer(false); setCurrentStep(0); }}
                className="w-full py-2.5 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition text-sm"
              >
                ↺ Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HVACClassroomPreview() {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [completedTabs, setCompletedTabs] = useState<Record<string, Set<TabId>>>({});
  const [videoProgress, setVideoProgress] = useState(0);
  const handleProgress = useCallback((p: number) => {
    setVideoProgress((prev) => (prev === p ? prev : p));
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCareerSafe = currentModuleIndex === course.modules.length;
  const mod = isCareerSafe ? course.modules[0] : course.modules[currentModuleIndex]; // fallback for CareerSafe view
  const modId = isCareerSafe ? 'careersafe' : (mod.id || `hvac-${String(currentModuleIndex + 1).padStart(2, '0')}`);

  const modCompleted = completedTabs[modId] || new Set<TabId>();
  const isTabDone = (tab: TabId) => modCompleted.has(tab);
  // Preview mode — all tabs and modules are accessible
  const isTabUnlocked = (_tab: TabId) => true;
  const allTabsDone = TABS.every((t) => isTabDone(t.id));
  const isModuleUnlocked = (_mi: number) => true;

  const completeTab = (tab: TabId) => {
    setCompletedTabs((prev) => {
      const next = { ...prev };
      const set = new Set(next[modId] || []);
      set.add(tab);
      next[modId] = set;
      return next;
    });
    const idx = TABS.findIndex((t) => t.id === tab);
    if (idx < TABS.length - 1) {
      setTimeout(() => setActiveTab(TABS[idx + 1].id), 800);
    }
  };

  const goToModule = (mi: number) => {
    if (!isModuleUnlocked(mi)) return;
    setCurrentModuleIndex(mi);
    setActiveTab('content');
    setVideoProgress(0);
    setSidebarOpen(false);
  };

  const completedModuleCount = course.modules.filter((_, mi) => {
    const id = course.modules[mi].id || `hvac-${String(mi + 1).padStart(2, '0')}`;
    const done = completedTabs[id] || new Set<TabId>();
    return TABS.every((t) => done.has(t.id));
  }).length;
  const overallProgress = Math.round((completedModuleCount / course.modules.length) * 100);

  const videoLessons = mod.lessons.filter((l) => l.type === 'video');

  return (
    <>
      {/* Hide site header/footer — course has its own layout */}
      <style>{`
        header, footer, nav, .site-header, .site-footer { display: none !important; }
        #main-content { padding-top: 0 !important; }
      `}</style>
    <div className="flex h-screen bg-slate-50">
      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900 text-white text-center py-3 text-sm font-medium shadow-lg">
        <GraduationCap className="w-4 h-4 inline mr-2" />
        <span className="font-bold">HVAC Technician Program</span>
        <span className="hidden sm:inline text-slate-400 mx-2">|</span>
        <span className="hidden sm:inline text-slate-300">640 Hours &middot; EPA 608 &middot; OSHA 10 &middot; CPR/AED</span>
        <Link href="/apply?program=hvac-technician" className="ml-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-3 py-1 rounded-full text-xs font-bold transition">Apply Now</Link>
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-12 left-4 z-50 bg-white p-2.5 rounded-lg shadow-lg"
        aria-label="Toggle module list"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-80 bg-white border-r overflow-y-auto transition-transform duration-300 fixed md:relative h-full z-40 pt-10`}>
        <div className="p-5 border-b">
          <Link href="/programs/hvac-technician" className="text-sm text-brand-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> Back to Program
          </Link>
          <h2 className="font-bold text-lg text-slate-900 mt-2">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{completedModuleCount}/{course.modules.length} modules</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="bg-slate-100 rounded-full h-2">
              <div className="bg-brand-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="p-3">
          {course.modules.map((m, mi) => {
            const mId = m.id || `hvac-${String(mi + 1).padStart(2, '0')}`;
            const mDone = completedTabs[mId] || new Set<TabId>();
            const mAllDone = TABS.every((t) => mDone.has(t.id));
            const locked = !isModuleUnlocked(mi);
            const isActive = mi === currentModuleIndex;

            return (
              <button
                key={mi}
                onClick={() => goToModule(mi)}
                disabled={locked}
                className={`w-full text-left p-3 rounded-lg mb-1 transition ${
                  locked ? 'opacity-40 cursor-not-allowed'
                    : isActive ? 'bg-brand-blue-50 border-l-4 border-brand-blue-600'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    locked ? 'bg-slate-200 text-slate-400'
                      : mAllDone ? 'bg-brand-green-100 text-brand-green-600'
                      : isActive ? 'bg-brand-blue-100 text-brand-blue-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {locked ? <Lock className="w-3.5 h-3.5" />
                      : mAllDone ? <CheckCircle className="w-4 h-4" />
                      : mi + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${locked ? 'text-slate-400' : 'text-slate-800'}`}>{m.title}</p>
                    <p className="text-xs text-slate-400">
                      {locked ? 'Complete previous module' : `${mDone.size}/${TABS.length} tabs`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {/* CareerSafe External Certifications */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">External Certifications</p>
            <button
              onClick={() => { setCurrentModuleIndex(course.modules.length); setSidebarOpen(false); }}
              className={`w-full text-left p-3 rounded-lg mb-1 transition ${
                currentModuleIndex === course.modules.length
                  ? 'bg-amber-50 border-l-4 border-amber-500'
                  : 'hover:bg-slate-50 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  currentModuleIndex === course.modules.length
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${currentModuleIndex === course.modules.length ? 'text-amber-800' : 'text-slate-800'}`}>CareerSafe Certifications</p>
                  <p className="text-xs text-slate-400">OSHA 10 &middot; CPR/AED</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">

          {/* CareerSafe special view */}
          {currentModuleIndex === course.modules.length ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-amber-600 font-medium">Required External Certifications</p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">CareerSafe — OSHA 10 &amp; CPR/AED</h1>
                <p className="text-slate-600 mt-2 text-sm">These credentials are delivered through CareerSafe&apos;s online platform. Elevate provides access — CareerSafe issues the DOL cards.</p>
              </div>
              <div className="space-y-8">
                {HVAC_MODULE_CONTENT['careersafe']}
              </div>
            </>
          ) : (
          <>
          {/* Module header */}
          <div className="mb-6">
            <p className="text-sm text-brand-blue-600 font-medium">Module {currentModuleIndex + 1} of {course.modules.length}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{mod.title}</h1>
            {mod.competency && <p className="text-slate-600 mt-2 text-sm">{mod.competency}</p>}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
            {TABS.map((tab) => {
              const done = isTabDone(tab.id);
              const unlocked = isTabUnlocked(tab.id);
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => unlocked && setActiveTab(tab.id)}
                  disabled={!unlocked}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    !unlocked ? 'border-transparent text-slate-300 cursor-not-allowed'
                      : active ? 'border-brand-blue-600 text-brand-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {!unlocked ? <Lock className="w-4 h-4" />
                    : done ? <CheckCircle className="w-4 h-4 text-brand-green-600" />
                    : <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── VIDEO TAB ── */}
          {activeTab === 'video' && (
            <div>
              {currentModuleIndex === 0 ? (
                <InteractiveVideoPlayer
                  videoUrl="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac/hvac-01-01-v13.mp4"
                  title={mod.title}
                  onProgress={handleProgress}
                  onComplete={() => completeTab('video')}
                />
              ) : (
                <div className="bg-slate-900 aspect-video rounded-xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-semibold">{mod.title}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {videoLessons.length} video{videoLessons.length !== 1 ? 's' : ''} · {videoLessons.reduce((s, l) => s + (l.durationMinutes || 15), 0)} min
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3 text-sm">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div className="bg-brand-blue-600 h-2 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                </div>
                <span className="text-slate-500">{Math.round(videoProgress)}%</span>
              </div>
              {currentModuleIndex !== 0 && !isTabDone('video') && (
                <button onClick={() => completeTab('video')} className="mt-4 w-full py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition">
                  Mark Video Complete — Continue to Content
                </button>
              )}
              {isTabDone('video') && (
                <p className="mt-4 flex items-center gap-2 text-brand-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Video complete</p>
              )}
            </div>
          )}

          {/* ── CONTENT TAB ── */}
          {activeTab === 'content' && (
            <div className="space-y-8">
              {/* Module content from data-driven renderer */}
              {HVAC_MODULE_CONTENT[modId]}

              {/* Interactive Diagrams — always rendered when available */}
              {(() => {
                const diagrams = getModuleDiagrams(modId);
                const interactiveDiagrams = diagrams.filter((d) => d.hasInteractive && DIAGRAM_COMPONENTS[d.id]);
                const staticDiagrams = diagrams.filter((d) => !d.hasInteractive || !DIAGRAM_COMPONENTS[d.id]);
                if (diagrams.length === 0) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-brand-blue-600" />
                      <h2 className="text-xl font-bold text-slate-900">Interactive Diagrams</h2>
                    </div>
                    <p className="text-sm text-slate-600">
                      Click on components in each diagram to learn what they do. These same diagrams appear throughout the program — repetition builds understanding.
                    </p>
                    {interactiveDiagrams.map((d) => (
                      <div key={d.id}>{DIAGRAM_COMPONENTS[d.id]}</div>
                    ))}
                    {staticDiagrams.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {staticDiagrams.map((d) => (
                          <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-4">
                            <h3 className="font-semibold text-slate-800 text-sm">{d.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">{d.learningObjective}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {!isTabDone('content') && (
                <button onClick={() => completeTab('content')} className="mt-6 w-full py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition">
                  I&apos;ve Read Everything — Continue to Lab
                </button>
              )}
              {isTabDone('content') && (
                <p className="mt-4 flex items-center gap-2 text-brand-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Content complete</p>
              )}
            </div>
          )}

          {/* ── LAB TAB ── */}
          {activeTab === 'lab' && (
            <div>
              {/* Interactive Labs — mapped by module */}

              {/* Component Identification — Modules 1-3 */}
              {['hvac-01', 'hvac-02', 'hvac-03'].includes(modId) && (
                <div className="mb-8">
                  <ComponentIDLab />
                </div>
              )}

              {/* Gauge Reading Lab — Modules 5-8 */}
              {['hvac-05', 'hvac-06', 'hvac-07', 'hvac-08'].includes(modId) && (
                <div className="mb-8">
                  <GaugeReadingLab />
                </div>
              )}

              {/* EPA 608 Practice Exam — Module 13 */}
              {modId === 'hvac-13' && (
                <div className="mb-8">
                  <EPA608PracticeExam />
                </div>
              )}

              {/* Condenser Diagram + Troubleshoot — Modules 4, 9-12 */}
              {['hvac-04', 'hvac-09', 'hvac-10', 'hvac-11', 'hvac-12'].includes(modId) && (
                <div className="space-y-6 mb-8">
                  <CondenserDiagram mode="explore" />
                  <TroubleshootScenario
                    scenarios={CONDENSER_SCENARIOS}
                    equipmentLabel="Residential Condenser Unit"
                    onComplete={(result: { correct: boolean }) => { if (result.correct) completeTab('lab'); }}
                  />
                </div>
              )}

              <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">Hands-On Lab</h2>

                  {/* Lab lessons */}
                  {mod.lessons.filter((l) => l.type === 'lab').map((l, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-5 h-5 text-brand-green-600" />
                        <h3 className="font-semibold text-slate-800">{l.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{l.description}</p>
                    </div>
                  ))}

                  {/* Interactive diagram labs (quiz mode) */}
                  {(() => {
                    const diagrams = getModuleDiagrams(modId);
                    const quizDiagrams = diagrams.filter((d) => d.hasInteractive && DIAGRAM_COMPONENTS[d.id]);
                    if (quizDiagrams.length === 0) return null;
                    return (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Interactive Diagram Lab</h3>
                        <p className="text-sm text-slate-600">
                          Identify the components in each diagram. Click on each part to reveal its name and function.
                        </p>
                        {quizDiagrams.map((d) => {
                          // Render quiz-mode versions of diagrams
                          const quizComponents: Record<string, React.ReactNode> = {
                            'hvac-system-overview': <HVACSystemOverview mode="quiz" />,
                            'refrigeration-cycle': <RefrigerationCycleDiagram mode="quiz" />,
                            'condenser-breakdown': <CondenserBreakdownDiagram mode="quiz" />,
                            'furnace-breakdown': <FurnaceBreakdownDiagram mode="quiz" />,
                            'thermostat-wiring': <ThermostatWiringDiagram mode="quiz" />,
                            'control-circuit': <ElectricalCircuitDiagram mode="quiz" />,
                            'duct-distribution': <DuctDistributionDiagram mode="quiz" />,
                            'troubleshooting-flowchart': <TroubleshootingFlowchart mode="guided" />,
                          };
                          return quizComponents[d.id] ? <div key={d.id}>{quizComponents[d.id]}</div> : null;
                        })}
                      </div>
                    );
                  })()}

                  {/* Service call scenarios */}
                  {(() => {
                    const scenarios = getModuleScenarios(modId);
                    if (scenarios.length === 0) return null;
                    return (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Service Call Scenarios</h3>
                        <p className="text-sm text-slate-600">
                          Work through real diagnostic scenarios. Follow the steps a technician would take on an actual service call.
                        </p>
                        {scenarios.map((scenario) => (
                          <ServiceCallCard key={scenario.id} scenario={scenario} />
                        ))}
                      </div>
                    );
                  })()}

                  {mod.lessons.filter((l) => l.type === 'lab').length === 0 &&
                   getModuleDiagrams(modId).filter((d) => d.hasInteractive).length === 0 &&
                   getModuleScenarios(modId).length === 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                      <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">This module&apos;s lab is completed during OJT (on-the-job training).</p>
                    </div>
                  )}
                  {!isTabDone('lab') && (
                    <button onClick={() => completeTab('lab')} className="mt-4 w-full py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition">
                      Mark Lab Complete — Continue to Quiz
                    </button>
                  )}
                </div>
              {isTabDone('lab') && (
                <p className="mt-4 flex items-center gap-2 text-brand-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Lab complete</p>
              )}
            </div>
          )}

          {/* ── QUIZ TAB ── */}
          {activeTab === 'quiz' && (
            <div>
              <PostVideoQuiz
                questions={HVAC_QUIZ_BANKS[modId] || HVAC_QUIZ_BANKS['hvac-05']}
                passingScore={80}
                videoWatchGateMet={true}
                onComplete={(score: number, passed: boolean) => { if (passed) completeTab('quiz'); }}
                onUnlock={() => completeTab('quiz')}
              />
              {isTabDone('quiz') && (
                <p className="mt-4 flex items-center gap-2 text-brand-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Quiz passed</p>
              )}
            </div>
          )}

          {/* Module nav */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6 pb-12 mt-8">
            <button
              onClick={() => currentModuleIndex > 0 && goToModule(currentModuleIndex - 1)}
              disabled={currentModuleIndex === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
                currentModuleIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" /> Previous Module
            </button>
            <button
              onClick={() => allTabsDone && currentModuleIndex < course.modules.length - 1 && goToModule(currentModuleIndex + 1)}
              disabled={!allTabsDone || currentModuleIndex === course.modules.length - 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
                !allTabsDone || currentModuleIndex === course.modules.length - 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
              }`}
            >
              {!allTabsDone ? <><Lock className="w-4 h-4" /> Complete All Tabs</> : <>Next Module <ChevronRight className="w-5 h-5" /></>}
            </button>
          </div>
          </>
          )}
        </div>
      </main>
    </div>
    </>
  );
}
