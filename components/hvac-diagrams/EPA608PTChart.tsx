'use client';

/**
 * PTChartDrill — Interactive Pressure-Temperature chart tool.
 * Student selects a refrigerant and enters a pressure reading.
 * The tool shows the saturation temperature and explains superheat/subcooling.
 */

import { useState } from 'react';
import { Thermometer, ArrowRight } from 'lucide-react';

// Simplified P/T data for common refrigerants (pressure in PSIG, temp in °F)
// Values are approximate saturation temperatures at given pressures
const PT_DATA: Record<string, { pressures: number[]; temps: number[] }> = {
  'R-22': {
    pressures: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 175, 200, 225, 250],
    temps:     [-41, -23, -9, 2, 11, 19, 26, 33, 39, 45, 50, 55, 60, 65, 69, 74, 83, 92, 100, 108],
  },
  'R-410A': {
    pressures: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 325, 350, 375, 400],
    temps:     [-62, -41, -26, -14, -4, 5, 13, 20, 27, 33, 39, 44, 49, 54, 59, 63, 69, 74, 79, 84],
  },
  'R-404A': {
    pressures: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 225, 250],
    temps:     [-55, -38, -25, -14, -5, 3, 10, 17, 23, 29, 34, 44, 53, 61, 69, 76, 85, 93],
  },
  'R-134a': {
    pressures: [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200],
    temps:     [-15, -4, 6, 14, 21, 28, 34, 45, 55, 63, 71, 79, 86, 93, 105, 116, 126, 135, 144],
  },
};

const REFRIGERANTS = Object.keys(PT_DATA);

function interpolate(pressures: number[], temps: number[], target: number): number | null {
  if (target < pressures[0] || target > pressures[pressures.length - 1]) return null;
  for (let i = 0; i < pressures.length - 1; i++) {
    if (target >= pressures[i] && target <= pressures[i + 1]) {
      const ratio = (target - pressures[i]) / (pressures[i + 1] - pressures[i]);
      return Math.round(temps[i] + ratio * (temps[i + 1] - temps[i]));
    }
  }
  return null;
}

const SCENARIOS = [
  {
    label: 'Normal cooling — R-410A suction',
    refrigerant: 'R-410A',
    pressure: 120,
    lineTemp: 50,
    type: 'suction',
    description: 'Suction line at the evaporator outlet. Calculate superheat.',
  },
  {
    label: 'Low charge — R-410A suction',
    refrigerant: 'R-410A',
    pressure: 95,
    lineTemp: 65,
    type: 'suction',
    description: 'Low suction pressure with high line temp. What does this indicate?',
  },
  {
    label: 'Normal — R-22 suction',
    refrigerant: 'R-22',
    pressure: 70,
    lineTemp: 50,
    type: 'suction',
    description: 'R-22 system suction line. Calculate superheat.',
  },
  {
    label: 'Liquid line — R-410A subcooling',
    refrigerant: 'R-410A',
    pressure: 300,
    lineTemp: 90,
    type: 'liquid',
    description: 'Liquid line near condenser outlet. Calculate subcooling.',
  },
];

export default function EPA608PTChart({ onComplete }: { onComplete?: () => void }) {
  const [selectedRef, setSelectedRef] = useState('R-410A');
  const [pressure, setPressure] = useState('');
  const [lineTemp, setLineTemp] = useState('');
  const [lineType, setLineType] = useState<'suction' | 'liquid'>('suction');
  const [result, setResult] = useState<{ satTemp: number; delta: number; label: string; color: string; explanation: string } | null>(null);
  const [scenario, setScenario] = useState<number | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<Set<number>>(new Set());

  function calculate() {
    const p = parseFloat(pressure);
    const t = parseFloat(lineTemp);
    if (isNaN(p) || isNaN(t)) return;

    const data = PT_DATA[selectedRef];
    const satTemp = interpolate(data.pressures, data.temps, p);
    if (satTemp === null) {
      setResult(null);
      return;
    }

    const delta = lineType === 'suction' ? t - satTemp : satTemp - t;
    let label = '';
    let color = '';
    let explanation = '';

    if (lineType === 'suction') {
      label = `Superheat: ${delta}°F`;
      if (delta < 5) {
        color = 'text-brand-red-600';
        explanation = 'Superheat below 5°F — evaporator is flooded. Risk of liquid slugging the compressor. System may be overcharged or TXV stuck open.';
      } else if (delta <= 15) {
        color = 'text-brand-green-600';
        explanation = 'Superheat 5–15°F — normal operating range for most systems. Evaporator is properly fed with refrigerant.';
      } else if (delta <= 25) {
        color = 'text-amber-600';
        explanation = 'Superheat 16–25°F — slightly high. System may be undercharged or TXV is restricting flow.';
      } else {
        color = 'text-brand-red-600';
        explanation = 'Superheat above 25°F — evaporator is starved. System is significantly undercharged or has a restriction.';
      }
    } else {
      label = `Subcooling: ${delta}°F`;
      if (delta < 5) {
        color = 'text-brand-red-600';
        explanation = 'Subcooling below 5°F — insufficient liquid. Flash gas may be entering the expansion device, reducing capacity.';
      } else if (delta <= 20) {
        color = 'text-brand-green-600';
        explanation = 'Subcooling 5–20°F — normal range. Liquid line has adequate subcooled refrigerant entering the expansion device.';
      } else {
        color = 'text-amber-600';
        explanation = 'Subcooling above 20°F — may indicate overcharge or condenser issue. Verify system charge.';
      }
    }

    setResult({ satTemp, delta, label, color, explanation });
  }

  function loadScenario(i: number) {
    const s = SCENARIOS[i];
    setSelectedRef(s.refrigerant);
    setPressure(s.pressure.toString());
    setLineTemp(s.lineTemp.toString());
    setLineType(s.type as 'suction' | 'liquid');
    setResult(null);
    setScenario(i);
  }

  function markScenarioDone() {
    if (scenario !== null) {
      setCompletedScenarios((prev) => new Set([...prev, scenario]));
    }
  }

  const allDone = completedScenarios.size >= 3;

  return (
    <div className="space-y-5">

      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Core — P/T Charts</p>
        <h2 className="text-xl font-extrabold">Pressure-Temperature Drill</h2>
        <p className="text-slate-400 text-sm mt-1">
          Enter a pressure reading → get the saturation temperature → calculate superheat or subcooling.
        </p>
      </div>

      {/* Practice scenarios */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Practice Scenarios</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => loadScenario(i)}
              className={`text-left rounded-xl border px-3 py-2.5 transition-all text-sm ${
                scenario === i
                  ? 'bg-brand-blue-50 border-brand-blue-300 font-semibold text-brand-blue-700'
                  : completedScenarios.has(i)
                  ? 'bg-brand-green-50 border-brand-green-200 text-slate-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              {completedScenarios.has(i) && <span className="text-brand-green-500 mr-1">✓</span>}
              {s.label}
            </button>
          ))}
        </div>
        {scenario !== null && (
          <p className="text-xs text-slate-500 mt-2 italic">{SCENARIOS[scenario].description}</p>
        )}
      </div>

      {/* Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <p className="font-bold text-slate-900 text-sm">P/T Calculator</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Refrigerant */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Refrigerant</label>
            <select
              value={selectedRef}
              onChange={(e) => { setSelectedRef(e.target.value); setResult(null); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 bg-white"
            >
              {REFRIGERANTS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Line type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Line Type</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => { setLineType('suction'); setResult(null); }}
                className={`flex-1 py-2 text-xs font-bold transition-colors ${lineType === 'suction' ? 'bg-brand-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Suction
              </button>
              <button
                onClick={() => { setLineType('liquid'); setResult(null); }}
                className={`flex-1 py-2 text-xs font-bold transition-colors ${lineType === 'liquid' ? 'bg-brand-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Liquid
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Gauge Pressure (PSIG)
            </label>
            <input
              type="number"
              value={pressure}
              onChange={(e) => { setPressure(e.target.value); setResult(null); }}
              placeholder="e.g. 120"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Line Temperature (°F)
            </label>
            <input
              type="number"
              value={lineTemp}
              onChange={(e) => { setLineTemp(e.target.value); setResult(null); }}
              placeholder="e.g. 50"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
            />
          </div>
        </div>

        <button
          onClick={calculate}
          className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Thermometer className="w-4 h-4" />
          Calculate
        </button>

        {/* Result */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Saturation Temp</p>
                <p className="text-2xl font-extrabold text-slate-900">{result.satTemp}°F</p>
                <p className="text-xs text-slate-500">at {pressure} PSIG</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Line Temp</p>
                <p className="text-2xl font-extrabold text-slate-900">{lineTemp}°F</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-slate-500 font-medium">{lineType === 'suction' ? 'Superheat' : 'Subcooling'}</p>
                <p className={`text-2xl font-extrabold ${result.color}`}>{result.delta}°F</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className={`font-extrabold text-sm ${result.color}`}>{result.label}</p>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">{result.explanation}</p>
            </div>
            {scenario !== null && !completedScenarios.has(scenario) && (
              <button
                onClick={markScenarioDone}
                className="text-brand-green-600 text-sm font-semibold hover:text-brand-green-700"
              >
                ✓ Mark scenario complete
              </button>
            )}
          </div>
        )}
      </div>

      {allDone && onComplete && (
        <button
          onClick={onComplete}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          P/T charts mastered — Continue →
        </button>
      )}
    </div>
  );
}
