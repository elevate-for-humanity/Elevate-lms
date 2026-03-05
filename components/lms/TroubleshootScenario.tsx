'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Thermometer, Gauge, Zap, Wind, AlertTriangle, CheckCircle,
  XCircle, RotateCcw, ChevronRight, Eye, EyeOff, HelpCircle, Award, Activity,
} from 'lucide-react';
import type { FaultScenario, GaugeReading } from '@/lib/simulations/condenser-scenarios';

const iconMap = { pressure: Gauge, temp: Thermometer, voltage: Zap, airflow: Wind, amperage: Activity } as const;

const diffConfig = {
  guided:    { label: 'Guided',    cls: 'bg-brand-green-100 text-brand-green-700 border-brand-green-300', showHints: true,  showNormals: true,  highlight: true,  maxAttempts: 3, desc: 'Hints and normal ranges shown' },
  practice:  { label: 'Practice',  cls: 'bg-amber-100 text-amber-700 border-amber-300',                  showHints: false, showNormals: true,  highlight: false, maxAttempts: 2, desc: 'Normal ranges visible, no hints' },
  challenge: { label: 'Challenge', cls: 'bg-brand-red-100 text-brand-red-700 border-brand-red-300',       showHints: false, showNormals: false, highlight: false, maxAttempts: 1, desc: 'No aids — diagnose independently' },
};

function isAbnormal(r: GaugeReading): boolean {
  const val = parseFloat(r.value);
  const m = r.normal.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (m) return val < parseFloat(m[1]) || val > parseFloat(m[2]);
  const s = r.normal.match(/([\d.]+)/);
  if (s) return Math.abs(val - parseFloat(s[1])) / parseFloat(s[1]) > 0.15;
  return false;
}

interface Props {
  scenarios: FaultScenario[];
  equipmentLabel?: string;
  onComplete?: (result: { scenarioId: string; correct: boolean; attempts: number }) => void;
  forceDifficulty?: 'guided' | 'practice' | 'challenge';
}

export default function TroubleshootScenario({ scenarios, equipmentLabel = 'HVAC System', onComplete, forceDifficulty }: Props) {
  const [scenarioIdx, setScenarioIdx] = useState(() => Math.floor(Math.random() * scenarios.length));
  const [difficulty, setDifficulty] = useState<'guided' | 'practice' | 'challenge'>(forceDifficulty || 'guided');
  const [phase, setPhase] = useState<'complaint' | 'inspect' | 'readings' | 'diagnose' | 'result'>('complaint');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const scenario = scenarios[scenarioIdx];
  const cfg = diffConfig[difficulty];

  const choices = useMemo(() => {
    const all = [scenario.correctFault, ...scenario.distractors];
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all;
  }, [scenario.correctFault, scenario.distractors]);

  const submitDiagnosis = useCallback(() => {
    if (!selectedAnswer) return;
    const correct = selectedAnswer === scenario.correctFault;
    const n = attempts + 1;
    setAttempts(n);
    if (correct || n >= cfg.maxAttempts) {
      setIsCorrect(correct);
      setPhase('result');
      onComplete?.({ scenarioId: scenario.id, correct, attempts: n });
    } else {
      setSelectedAnswer(null);
      setShowHint(true);
    }
  }, [selectedAnswer, scenario, attempts, cfg.maxAttempts, onComplete]);

  const reset = useCallback(() => {
    setScenarioIdx((scenarioIdx + 1) % scenarios.length);
    setPhase('complaint'); setSelectedAnswer(null); setAttempts(0);
    setIsCorrect(null); setShowHint(false); setRevealed(new Set());
  }, [scenarioIdx, scenarios.length]);

  // ── COMPLAINT ──
  if (phase === 'complaint') return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
            <div><h3 className="text-white font-bold text-lg">Diagnostic Simulation</h3><p className="text-brand-blue-100 text-sm">{equipmentLabel}</p></div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.cls}`}>{cfg.label}</span>
        </div>
      </div>
      <div className="p-6">
        {!forceDifficulty && (
          <div className="flex items-center gap-2 mb-6">
            {(['guided','practice','challenge'] as const).map(d => (
              <button key={d} onClick={() => { setDifficulty(d); reset(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${difficulty === d ? diffConfig[d].cls : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                {diffConfig[d].label}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-2">{cfg.desc}</span>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Service Call Complaint</p>
          <p className="text-amber-900 text-lg font-medium leading-relaxed">&ldquo;{scenario.complaint}&rdquo;</p>
        </div>
        <button onClick={() => setPhase('inspect')} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
          Inspect Equipment <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ── INSPECT ──
  if (phase === 'inspect') return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4 flex items-center gap-3">
        <Eye className="w-5 h-5 text-white" /><h3 className="text-white font-bold">Visual Inspection</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600 text-sm mb-4">You approach the {equipmentLabel.toLowerCase()}. Here&apos;s what you observe:</p>
        <div className="space-y-3 mb-6">
          {scenario.symptoms.map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-700 text-xs font-bold">{i+1}</span></div>
              <p className="text-slate-800 text-sm">{s}</p>
            </div>
          ))}
        </div>
        {cfg.showHints && <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6 text-sm text-brand-blue-800"><HelpCircle className="w-4 h-4 inline mr-1" /><strong>Hint:</strong> Which symptoms are abnormal? What measurements would narrow down the fault?</div>}
        <button onClick={() => setPhase('readings')} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
          Take Measurements <Gauge className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ── READINGS ──
  if (phase === 'readings') return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4 flex items-center gap-3">
        <Gauge className="w-5 h-5 text-white" /><h3 className="text-white font-bold">System Readings</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600 text-sm mb-4">Click each reading to reveal the measurement:</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {scenario.readings.map((r, i) => {
            const shown = revealed.has(i);
            const abnormal = isAbnormal(r);
            const Icon = iconMap[r.icon || 'pressure'] || Gauge;
            return (
              <button key={i} onClick={() => setRevealed(prev => new Set(prev).add(i))}
                className={`text-left p-4 rounded-xl border-2 transition ${shown ? (abnormal && cfg.highlight ? 'border-brand-red-300 bg-brand-red-50' : 'border-brand-green-200 bg-brand-green-50') : 'border-slate-200 bg-slate-50 hover:border-brand-blue-300 cursor-pointer'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${shown ? (abnormal && cfg.highlight ? 'text-brand-red-600' : 'text-brand-green-600') : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-500 uppercase">{r.label}</span>
                </div>
                {shown ? (<><p className={`text-2xl font-bold ${abnormal && cfg.highlight ? 'text-brand-red-700' : 'text-slate-900'}`}>{r.value} <span className="text-sm font-normal text-slate-500">{r.unit}</span></p>{cfg.showNormals && <p className="text-xs text-slate-400 mt-1">Normal: {r.normal}</p>}</>)
                  : (<div className="flex items-center gap-2 text-slate-400"><EyeOff className="w-4 h-4" /><span className="text-sm">Tap to measure</span></div>)}
              </button>
            );
          })}
        </div>
        {revealed.size === scenario.readings.length
          ? <button onClick={() => setPhase('diagnose')} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">Make Diagnosis <ChevronRight className="w-5 h-5" /></button>
          : <p className="text-center text-sm text-slate-400">Reveal all {scenario.readings.length} readings to proceed ({scenario.readings.length - revealed.size} remaining)</p>}
      </div>
    </div>
  );

  // ── DIAGNOSE ──
  if (phase === 'diagnose') return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
        <Activity className="w-5 h-5 text-white" /><h3 className="text-white font-bold">Diagnosis</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600 text-sm mb-2">Based on the complaint, symptoms, and readings — what is the fault?</p>
        {attempts > 0 && <p className="text-brand-red-600 text-sm mb-4 flex items-center gap-1"><XCircle className="w-4 h-4" /> Incorrect — {cfg.maxAttempts - attempts} attempt{cfg.maxAttempts - attempts !== 1 ? 's' : ''} remaining</p>}
        {showHint && cfg.showHints && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800"><HelpCircle className="w-4 h-4 inline mr-1" />Review the abnormal readings. Which component would cause those specific deviations?</div>}
        <div className="space-y-2 mb-6">
          {choices.map(c => (
            <button key={c} onClick={() => setSelectedAnswer(c)}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${selectedAnswer === c ? 'border-brand-blue-500 bg-brand-blue-50 ring-2 ring-brand-blue-200' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAnswer === c ? 'border-brand-blue-500 bg-brand-blue-500' : 'border-slate-300'}`}>
                  {selectedAnswer === c && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm font-medium text-slate-800">{c}</span>
              </div>
            </button>
          ))}
        </div>
        <button onClick={submitDiagnosis} disabled={!selectedAnswer}
          className={`w-full font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 ${selectedAnswer ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          Submit Diagnosis
        </button>
      </div>
    </div>
  );

  // ── RESULT ──
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-6 py-4 ${isCorrect ? 'bg-gradient-to-r from-brand-green-600 to-emerald-600' : 'bg-gradient-to-r from-brand-red-600 to-rose-600'}`}>
        <div className="flex items-center gap-3">
          {isCorrect ? <CheckCircle className="w-6 h-6 text-white" /> : <XCircle className="w-6 h-6 text-white" />}
          <h3 className="text-white font-bold text-lg">{isCorrect ? 'Correct Diagnosis!' : 'Incorrect Diagnosis'}</h3>
        </div>
      </div>
      <div className="p-6">
        <div className={`rounded-xl p-5 mb-6 ${isCorrect ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500">Correct Answer</p>
          <p className="text-lg font-bold text-slate-900 mb-3">{scenario.correctFault}</p>
          <p className="text-sm text-slate-700 leading-relaxed">{scenario.explanation}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400 mb-1">Attempts</p><p className="text-xl font-bold text-slate-800">{attempts}</p></div>
          <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400 mb-1">Difficulty</p><p className="text-xl font-bold text-slate-800">{cfg.label}</p></div>
          <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400 mb-1">Result</p><p className={`text-xl font-bold ${isCorrect ? 'text-brand-green-600' : 'text-brand-red-600'}`}>{isCorrect ? 'Pass' : 'Fail'}</p></div>
        </div>
        {isCorrect && <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 rounded-lg p-3 mb-6"><Award className="w-5 h-5 text-brand-green-600" /><span className="text-sm font-medium text-brand-green-800">Competency verified — diagnostic accuracy recorded</span></div>}
        <button onClick={reset} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
          <RotateCcw className="w-5 h-5" /> Next Scenario (New Fault)
        </button>
      </div>
    </div>
  );
}
