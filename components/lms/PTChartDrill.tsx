'use client';

/**
 * PT Chart Drill — Pressure/Temperature practice.
 *
 * Students are given a pressure and must identify the saturation
 * temperature (or vice versa) for R-410A and R-22. This is one of
 * the most commonly failed topics on the EPA 608 exam.
 */

import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, ThermometerSun } from 'lucide-react';
import { PT_CHART_DRILLS } from '@/lib/courses/hvac-diagnostic-exercises';

// Full PT reference data — R-410A, R-22, R-454B, R-32
// R-454B and R-32 are the A2L replacements for R-410A under the AIM Act (2025+)
const PT_REFERENCE = {
  'R-410A': [
    { pressure: 72,  satTemp: 25  },
    { pressure: 118, satTemp: 40  },
    { pressure: 145, satTemp: 50  },
    { pressure: 175, satTemp: 60  },
    { pressure: 210, satTemp: 70  },
    { pressure: 247, satTemp: 80  },
    { pressure: 290, satTemp: 90  },
    { pressure: 335, satTemp: 100 },
    { pressure: 385, satTemp: 110 },
    { pressure: 418, satTemp: 115 },
    { pressure: 490, satTemp: 130 },
  ],
  'R-22': [
    { pressure: 37,  satTemp: 25  },
    { pressure: 57,  satTemp: 40  },
    { pressure: 69,  satTemp: 48  },
    { pressure: 76,  satTemp: 53  },
    { pressure: 84,  satTemp: 58  },
    { pressure: 121, satTemp: 70  },
    { pressure: 158, satTemp: 80  },
    { pressure: 196, satTemp: 90  },
    { pressure: 226, satTemp: 95  },
    { pressure: 260, satTemp: 100 },
  ],
  // R-454B (Opteon XL41) — primary R-410A replacement, A2L, GWP 466
  'R-454B': [
    { pressure: 62,  satTemp: 25  },
    { pressure: 101, satTemp: 40  },
    { pressure: 124, satTemp: 50  },
    { pressure: 150, satTemp: 60  },
    { pressure: 180, satTemp: 70  },
    { pressure: 213, satTemp: 80  },
    { pressure: 250, satTemp: 90  },
    { pressure: 291, satTemp: 100 },
    { pressure: 336, satTemp: 110 },
    { pressure: 360, satTemp: 115 },
    { pressure: 425, satTemp: 130 },
  ],
  // R-32 — used in mini-splits, A2L, GWP 675
  'R-32': [
    { pressure: 76,  satTemp: 25  },
    { pressure: 124, satTemp: 40  },
    { pressure: 152, satTemp: 50  },
    { pressure: 184, satTemp: 60  },
    { pressure: 220, satTemp: 70  },
    { pressure: 260, satTemp: 80  },
    { pressure: 305, satTemp: 90  },
    { pressure: 354, satTemp: 100 },
    { pressure: 408, satTemp: 110 },
    { pressure: 437, satTemp: 115 },
    { pressure: 515, satTemp: 130 },
  ],
};

type DrillMode = 'pressure-to-temp' | 'temp-to-pressure';

interface Props {
  onComplete?: (score: number) => void;
}

export default function PTChartDrill({ onComplete }: Props) {
  const drills = PT_CHART_DRILLS;
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<{ correct: boolean; given: number; correct_answer: number; user: number }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<DrillMode>('pressure-to-temp');
  const [showReference, setShowReference] = useState(false);
  const [done, setDone] = useState(false);

  const drill = drills[current];
  const tolerance = 3; // ±3°F or ±3 psig is acceptable

  const handleSubmit = useCallback(() => {
    const userVal = parseFloat(input);
    if (isNaN(userVal)) return;

    const correctAnswer = mode === 'pressure-to-temp' ? drill.correctSatTemp : drill.givenPressure;
    const isCorrect = Math.abs(userVal - correctAnswer) <= tolerance;

    const newResults = [...results, {
      correct: isCorrect,
      given: mode === 'pressure-to-temp' ? drill.givenPressure : drill.correctSatTemp,
      correct_answer: correctAnswer,
      user: userVal,
    }];
    setResults(newResults);
    setSubmitted(true);

    setTimeout(() => {
      if (current + 1 >= drills.length) {
        const score = Math.round((newResults.filter(r => r.correct).length / drills.length) * 100);
        setDone(true);
        onComplete?.(score);
      } else {
        setCurrent(c => c + 1);
        setInput('');
        setSubmitted(false);
      }
    }, 1200);
  }, [input, drill, mode, results, current, drills.length, onComplete]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const reset = () => {
    setCurrent(0);
    setInput('');
    setResults([]);
    setSubmitted(false);
    setDone(false);
  };

  const score = results.filter(r => r.correct).length;

  if (done) {
    const pct = Math.round((score / drills.length) * 100);
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl p-6 text-center ${pct >= 70 ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-4xl font-black mb-1 ${pct >= 70 ? 'text-brand-green-700' : 'text-red-700'}`}>{pct}%</p>
          <p className={`font-semibold ${pct >= 70 ? 'text-brand-green-800' : 'text-red-800'}`}>
            {score}/{drills.length} correct — {pct >= 70 ? 'Passing' : 'Keep practicing'}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            {pct >= 90 ? 'You know your PT charts cold. This will not trip you up on the exam.' :
             pct >= 70 ? 'Good. Review the ones you missed and drill again before the exam.' :
             'PT charts are worth 15-20% of the exam. Drill these daily until you hit 90%.'}
          </p>
        </div>

        {/* Missed questions review */}
        {results.filter(r => !r.correct).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="font-bold text-slate-900 text-sm mb-3">Missed — review these:</p>
            <div className="space-y-2">
              {results.filter(r => !r.correct).map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm bg-red-50 rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-slate-700">
                    {mode === 'pressure-to-temp'
                      ? `${r.given} psig → sat temp is `
                      : `${r.given}°F sat temp → pressure is `}
                    <span className="font-bold text-brand-green-700">{r.correct_answer}{mode === 'pressure-to-temp' ? '°F' : ' psig'}</span>
                    <span className="text-red-600 ml-2">(you said {r.user}{mode === 'pressure-to-temp' ? '°F' : ' psig'})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition">
          <RotateCcw className="w-4 h-4" /> Drill Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['pressure-to-temp', 'temp-to-pressure'] as DrillMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
              mode === m
                ? 'bg-brand-blue-600 text-white border-brand-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-blue-300'
            }`}
          >
            {m === 'pressure-to-temp' ? 'Pressure → Temp' : 'Temp → Pressure'}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Question {current + 1} of {drills.length}</span>
        <span className="font-semibold text-brand-green-600">{score} correct</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="h-1.5 bg-brand-blue-500 rounded-full transition-all"
          style={{ width: `${((current) / drills.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-xs font-bold text-slate-500 uppercase mb-1">{drill.refrigerant}</p>
        <p className="text-lg font-bold text-slate-900 mb-4">
          {mode === 'pressure-to-temp'
            ? <>At <span className="text-brand-blue-600">{drill.givenPressure} psig</span>, what is the saturation temperature?</>
            : <>At <span className="text-brand-blue-600">{drill.correctSatTemp}°F</span> saturation temperature, what is the pressure?</>
          }
        </p>

        <div className="flex gap-3">
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={mode === 'pressure-to-temp' ? '°F' : 'psig'}
            disabled={submitted}
            autoFocus
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-brand-blue-400 disabled:bg-slate-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input || submitted}
            className="px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-bold hover:bg-brand-blue-700 disabled:opacity-40 transition"
          >
            Check
          </button>
        </div>

        {submitted && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-3 ${
            results[results.length - 1]?.correct
              ? 'bg-brand-green-50 text-brand-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {results[results.length - 1]?.correct
              ? <><CheckCircle className="w-4 h-4" /> Correct!</>
              : <><XCircle className="w-4 h-4" /> Answer: {mode === 'pressure-to-temp' ? `${drill.correctSatTemp}°F` : `${drill.givenPressure} psig`}</>
            }
          </div>
        )}
      </div>

      {/* PT Reference toggle */}
      <button
        onClick={() => setShowReference(r => !r)}
        className="text-xs text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
      >
        {showReference ? 'Hide' : 'Show'} PT chart reference →
      </button>

      {showReference && (
        <div className="grid grid-cols-2 gap-3">
          {(['R-410A', 'R-22'] as const).map(ref => (
            <div key={ref} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 text-white text-xs font-bold px-3 py-2">{ref} PT Chart</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-2 py-1 text-left text-slate-600">psig</th>
                    <th className="px-2 py-1 text-left text-slate-600">°F sat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PT_REFERENCE[ref].map(row => (
                    <tr key={row.pressure} className="hover:bg-white">
                      <td className="px-2 py-1 font-bold text-slate-900">{row.pressure}</td>
                      <td className="px-2 py-1 text-slate-700">{row.satTemp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
