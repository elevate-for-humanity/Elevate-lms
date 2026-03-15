'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, X, Zap, Wind, Gauge, ThermometerSun, Info } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Component data — each hotspot on the condenser unit                */
/* ------------------------------------------------------------------ */

export interface CondenserComponent {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  function: string;
  /** SVG position as percentage of viewBox */
  x: number;
  y: number;
  /** Measurement points available on this component */
  measurements?: string[];
}

const CONDENSER_COMPONENTS: CondenserComponent[] = [
  {
    id: 'compressor',
    label: 'Compressor',
    shortLabel: 'COMP',
    description: 'Scroll or reciprocating compressor. Pumps refrigerant through the system by compressing low-pressure suction gas into high-pressure discharge gas.',
    function: 'Compresses refrigerant vapor from ~70 psig to ~300+ psig (R-410A). Draws 12-18 amps at full load.',
    x: 50, y: 65,
    measurements: ['Amperage draw', 'Suction pressure', 'Discharge pressure', 'Winding resistance'],
  },
  {
    id: 'fan-motor',
    label: 'Condenser Fan Motor',
    shortLabel: 'FAN',
    description: 'Single-speed or variable-speed motor mounted on top bracket. Pulls outdoor air across the condenser coil to reject heat.',
    function: 'Moves 1,500-3,000 CFM of air across the condenser coil. Draws 1.2-1.8 amps. Failure causes high head pressure.',
    x: 50, y: 18,
    measurements: ['Voltage supply', 'Amperage draw', 'Capacitor microfarads', 'RPM'],
  },
  {
    id: 'condenser-coil',
    label: 'Condenser Coil',
    shortLabel: 'COIL',
    description: 'Copper tubing with aluminum fins wrapped around the unit perimeter. Hot refrigerant gas flows through, releasing heat to outdoor air.',
    function: 'Rejects heat from the refrigerant. Discharge gas enters at ~160°F and exits as liquid at ~100-115°F. Dirty coils raise head pressure.',
    x: 15, y: 45,
    measurements: ['Discharge line temperature', 'Liquid line temperature', 'Subcooling', 'Coil condition'],
  },
  {
    id: 'contactor',
    label: 'Contactor',
    shortLabel: 'CONT',
    description: 'Electromagnetic switch controlled by the thermostat (24V signal). Closes to send 240V power to the compressor and fan motor.',
    function: 'When thermostat calls for cooling, 24V energizes the contactor coil, pulling contacts closed. Pitted contacts cause voltage drop.',
    x: 78, y: 55,
    measurements: ['Line voltage (L1-L2)', 'Load voltage', 'Coil voltage (24V)', 'Contact resistance'],
  },
  {
    id: 'capacitor',
    label: 'Run Capacitor',
    shortLabel: 'CAP',
    description: 'Dual-run capacitor (typically 35/5 µF or 40/5 µF). Provides phase shift to start and run the compressor and fan motor.',
    function: 'Stores and releases electrical energy to create the rotating magnetic field. A weak capacitor causes hard starting, high amps, and eventual motor failure.',
    x: 78, y: 38,
    measurements: ['Microfarad reading (µF)', 'Voltage rating', 'Visual inspection (bulging/leaking)'],
  },
  {
    id: 'service-valves',
    label: 'Service Valves',
    shortLabel: 'VALV',
    description: 'Schrader-type service ports on the suction (large) and liquid (small) lines. Used to connect gauge manifold for pressure readings.',
    function: 'Suction valve: low-side pressure (58-80 psig R-410A). Liquid valve: high-side pressure (200-350 psig). Always recover before opening.',
    x: 30, y: 82,
    measurements: ['Suction pressure', 'Discharge pressure', 'Superheat calculation', 'Subcooling calculation'],
  },
  {
    id: 'disconnect',
    label: 'Electrical Disconnect',
    shortLabel: 'DISC',
    description: 'Fused or non-fused disconnect box mounted on the wall near the unit. Provides local power shutoff for service.',
    function: 'ALWAYS pull the disconnect before working inside the unit. Verify 0V with meter before touching any wiring. Lockout/tagout required.',
    x: 88, y: 75,
    measurements: ['Line voltage (should be 0V when pulled)', 'Fuse continuity'],
  },
];

/* ------------------------------------------------------------------ */
/*  Difficulty modes                                                   */
/* ------------------------------------------------------------------ */

type Difficulty = 'guided' | 'practice' | 'challenge';

const difficultyMeta: Record<Difficulty, { label: string; cls: string; showLabels: boolean; showHints: boolean }> = {
  guided:    { label: 'Guided',    cls: 'bg-brand-green-100 text-brand-green-700 border-brand-green-300', showLabels: true,  showHints: true },
  practice:  { label: 'Practice',  cls: 'bg-amber-100 text-amber-700 border-amber-300',                  showLabels: false, showHints: true },
  challenge: { label: 'Challenge', cls: 'bg-brand-red-100 text-brand-red-700 border-brand-red-300',       showLabels: false, showHints: false },
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CondenserDiagramProps {
  /** Mode: 'explore' = free click, 'identify' = quiz-style identification */
  mode?: 'explore' | 'identify';
  onComplete?: (score: { correct: number; total: number }) => void;
  forceDifficulty?: Difficulty;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CondenserDiagram({ mode = 'explore', onComplete, forceDifficulty }: CondenserDiagramProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(forceDifficulty || 'guided');
  const [identified, setIdentified] = useState<Set<string>>(new Set());
  const [quizQueue, setQuizQueue] = useState<string[]>(() => {
    const ids = CONDENSER_COMPONENTS.map(c => c.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids;
  });
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const dm = difficultyMeta[difficulty];
  const selectedComp = CONDENSER_COMPONENTS.find(c => c.id === selected) || null;
  const currentQuizTarget = mode === 'identify' && quizQueue.length > 0 ? CONDENSER_COMPONENTS.find(c => c.id === quizQueue[0]) : null;

  const handleHotspotClick = useCallback((id: string) => {
    if (mode === 'explore') {
      setSelected(prev => prev === id ? null : id);
      return;
    }

    // Identify mode
    if (!currentQuizTarget || quizFeedback) return;
    setQuizAnswer(id);
    const correct = id === currentQuizTarget.id;
    setQuizFeedback(correct ? 'correct' : 'wrong');
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

    setTimeout(() => {
      if (correct) {
        setIdentified(prev => new Set(prev).add(id));
        setQuizQueue(prev => prev.slice(1));
      }
      setQuizAnswer(null);
      setQuizFeedback(null);

      // Check completion
      if (correct && quizQueue.length <= 1) {
        onComplete?.({ correct: score.correct + 1, total: score.total + 1 });
      }
    }, correct ? 1200 : 800);
  }, [mode, currentQuizTarget, quizFeedback, quizQueue, score, onComplete]);

  const allIdentified = mode === 'identify' && quizQueue.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Wind className="w-5 h-5 text-brand-blue-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Residential Condenser Unit</h3>
              <p className="text-slate-400 text-sm">
                {mode === 'explore' ? 'Tap any component to learn about it' : currentQuizTarget ? `Find the: ${currentQuizTarget.label}` : 'All components identified!'}
              </p>
            </div>
          </div>
          {!forceDifficulty && (
            <div className="flex gap-1.5">
              {(['guided', 'practice', 'challenge'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${difficulty === d ? difficultyMeta[d].cls : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'}`}
                >
                  {difficultyMeta[d].label}
                </button>
              ))}
            </div>
          )}
        </div>
        {mode === 'identify' && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${(identified.size / CONDENSER_COMPONENTS.length) * 100}%` }} />
            </div>
            <span className="text-white/70 text-xs">{identified.size}/{CONDENSER_COMPONENTS.length}</span>
          </div>
        )}
      </div>

      {/* Diagram Area */}
      <div className="relative bg-gradient-to-b from-sky-100 to-slate-100 p-4 md:p-8">
        {/* Quiz prompt banner */}
        {mode === 'identify' && currentQuizTarget && (
          <div className={`mb-4 p-3 rounded-xl text-center font-semibold text-sm border-2 ${
            quizFeedback === 'correct' ? 'bg-brand-green-50 border-brand-green-400 text-brand-green-800' :
            quizFeedback === 'wrong' ? 'bg-brand-red-50 border-brand-red-400 text-brand-red-800' :
            'bg-brand-blue-50 border-brand-blue-300 text-brand-blue-800'
          }`}>
            {quizFeedback === 'correct' ? '✓ Correct!' :
             quizFeedback === 'wrong' ? `✗ That's the ${CONDENSER_COMPONENTS.find(c => c.id === quizAnswer)?.label || ''}. Try again.` :
             `Tap the ${currentQuizTarget.label}`}
            {dm.showHints && !quizFeedback && (
              <span className="block text-xs font-normal mt-1 text-brand-blue-600">{currentQuizTarget.description.split('.')[0]}</span>
            )}
          </div>
        )}

        {allIdentified && (
          <div className="mb-4 p-4 rounded-xl bg-brand-green-50 border-2 border-brand-green-400 text-center">
            <CheckCircle className="w-8 h-8 text-brand-green-600 mx-auto mb-2" />
            <p className="font-bold text-brand-green-800">All Components Identified!</p>
            <p className="text-sm text-brand-green-700 mt-1">Score: {score.correct}/{score.total} ({Math.round((score.correct / Math.max(score.total, 1)) * 100)}% accuracy)</p>
          </div>
        )}

        {/* SVG Condenser Unit */}
        <svg viewBox="0 0 400 360" className="w-full max-w-lg mx-auto" role="img" aria-label="Residential condenser unit diagram">
          {/* Ground / concrete pad */}
          <rect x="60" y="300" width="280" height="20" rx="3" fill="#94a3b8" opacity="0.4" />
          <rect x="70" y="295" width="260" height="10" rx="2" fill="#cbd5e1" opacity="0.5" />

          {/* Unit cabinet */}
          <rect x="100" y="80" width="200" height="220" rx="8" fill="#374151" stroke="#1f2937" strokeWidth="2" />
          {/* Louvered sides (condenser coil) */}
          <g opacity="0.6">
            {Array.from({ length: 18 }, (_, i) => (
              <line key={`louver-l-${i}`} x1="100" y1={95 + i * 12} x2="100" y2={100 + i * 12} stroke="#9ca3af" strokeWidth="8" />
            ))}
            {Array.from({ length: 18 }, (_, i) => (
              <line key={`louver-r-${i}`} x1="300" y1={95 + i * 12} x2="300" y2={100 + i * 12} stroke="#9ca3af" strokeWidth="8" />
            ))}
          </g>

          {/* Top grille (fan area) */}
          <rect x="110" y="82" width="180" height="60" rx="6" fill="#1f2937" />
          <circle cx="200" cy="112" r="25" fill="none" stroke="#6b7280" strokeWidth="1.5" />
          <circle cx="200" cy="112" r="18" fill="none" stroke="#6b7280" strokeWidth="1" />
          {/* Fan blades */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <line key={`blade-${i}`} x1="200" y1="112" x2={200 + 20 * Math.cos((angle * Math.PI) / 180)} y2={112 + 20 * Math.sin((angle * Math.PI) / 180)} stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
          ))}

          {/* Compressor (inside, visible through cutaway) */}
          <ellipse cx="200" cy="230" rx="35" ry="40" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <ellipse cx="200" cy="225" rx="28" ry="32" fill="#334155" />
          <text x="200" y="230" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">COMP</text>

          {/* Refrigerant lines (suction = large, liquid = small) */}
          <line x1="120" y1="280" x2="120" y2="320" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
          <line x1="140" y1="280" x2="140" y2="320" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <text x="108" y="335" fill="#3b82f6" fontSize="7" fontWeight="bold">SUCTION</text>
          <text x="135" y="335" fill="#ef4444" fontSize="7" fontWeight="bold">LIQUID</text>

          {/* Electrical panel area (right side) */}
          <rect x="260" y="150" width="35" height="80" rx="3" fill="#292524" stroke="#57534e" strokeWidth="1" />
          {/* Contactor */}
          <rect x="265" y="160" width="25" height="20" rx="2" fill="#44403c" stroke="#78716c" strokeWidth="1" />
          <text x="277" y="174" textAnchor="middle" fill="#a8a29e" fontSize="5">CONT</text>
          {/* Capacitor */}
          <ellipse cx="277" cy="205" rx="10" ry="14" fill="#44403c" stroke="#78716c" strokeWidth="1" />
          <text x="277" y="208" textAnchor="middle" fill="#a8a29e" fontSize="5">CAP</text>

          {/* Disconnect box (on wall) */}
          <rect x="340" y="240" width="30" height="45" rx="3" fill="#78716c" stroke="#57534e" strokeWidth="1.5" />
          <line x1="355" y1="255" x2="355" y2="275" stroke="#fbbf24" strokeWidth="2" />
          <text x="355" y="295" textAnchor="middle" fill="#57534e" fontSize="6">DISC</text>
          {/* Wire from disconnect to unit */}
          <path d="M340,262 Q320,262 300,200" fill="none" stroke="#57534e" strokeWidth="1" strokeDasharray="4,3" />

          {/* Hotspot circles — interactive */}
          {CONDENSER_COMPONENTS.map(comp => {
            const cx = (comp.x / 100) * 400;
            const cy = (comp.y / 100) * 360;
            const isSelected = selected === comp.id;
            const isIdentified = identified.has(comp.id);
            const isQuizTarget = quizAnswer === comp.id;
            const isCorrectTarget = quizFeedback === 'correct' && isQuizTarget;
            const isWrongTarget = quizFeedback === 'wrong' && isQuizTarget;

            return (
              <g key={comp.id} onClick={() => handleHotspotClick(comp.id)} className="cursor-pointer" role="button" aria-label={dm.showLabels ? comp.label : `Component hotspot`}>
                {/* Pulse ring */}
                {!isIdentified && !isSelected && (
                  <circle cx={cx} cy={cy} r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4">
                    <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Main circle */}
                <circle
                  cx={cx} cy={cy} r="14"
                  fill={isCorrectTarget ? '#22c55e' : isWrongTarget ? '#ef4444' : isIdentified ? '#22c55e' : isSelected ? '#3b82f6' : '#ffffff'}
                  fillOpacity={isIdentified ? 0.9 : isSelected ? 0.95 : 0.85}
                  stroke={isCorrectTarget ? '#16a34a' : isWrongTarget ? '#dc2626' : isIdentified ? '#16a34a' : isSelected ? '#2563eb' : '#94a3b8'}
                  strokeWidth="2"
                  className="transition-all duration-200 hover:fill-opacity-100"
                />
                {/* Label or checkmark */}
                {isIdentified ? (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12">✓</text>
                ) : dm.showLabels ? (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={isSelected ? 'white' : '#374151'} fontSize="6" fontWeight="bold">
                    {comp.shortLabel}
                  </text>
                ) : (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={isSelected ? 'white' : '#6b7280'} fontSize="10">?</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info Panel (explore mode) */}
      {mode === 'explore' && selectedComp && (
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-blue-600" />
              <h4 className="font-bold text-slate-900 text-lg">{selectedComp.label}</h4>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed mb-3">{selectedComp.description}</p>
          <div className="bg-white rounded-lg p-3 border border-slate-200 mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Function</p>
            <p className="text-sm text-slate-800">{selectedComp.function}</p>
          </div>
          {selectedComp.measurements && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Measurement Points</p>
              <div className="flex flex-wrap gap-2">
                {selectedComp.measurements.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-blue-50 text-brand-blue-700 text-xs rounded-full border border-brand-blue-200">
                    <Gauge className="w-3 h-3" /> {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score footer (identify mode) */}
      {mode === 'identify' && score.total > 0 && !allIdentified && (
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-600">Accuracy: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)</span>
          <span className="text-xs text-slate-400">{CONDENSER_COMPONENTS.length - identified.size} remaining</span>
        </div>
      )}
    </div>
  );
}
