'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { GAUGE_READING_EXERCISES, type GaugeReadingExercise } from '@/lib/courses/hvac-diagnostic-exercises';

export default function GaugeReadingLab() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [superheatInput, setSuperheatInput] = useState('');
  const [subcoolingInput, setSubcoolingInput] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const exercises = GAUGE_READING_EXERCISES;
  const ex = exercises[currentIdx];

  const checkAnswer = () => {
    const shAnswer = parseInt(superheatInput);
    const scAnswer = parseInt(subcoolingInput);
    const shCorrect = Math.abs(shAnswer - ex.superheat) <= 2;
    const scCorrect = Math.abs(scAnswer - ex.subcooling) <= 2;
    const bothCorrect = shCorrect && scCorrect;

    setScore((prev) => ({
      correct: prev.correct + (bothCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setSubmitted(true);
  };

  const nextExercise = () => {
    setCurrentIdx((prev) => Math.min(prev + 1, exercises.length - 1));
    setSuperheatInput('');
    setSubcoolingInput('');
    setDiagnosisInput('');
    setSubmitted(false);
  };

  const reset = () => {
    setCurrentIdx(0);
    setSuperheatInput('');
    setSubcoolingInput('');
    setDiagnosisInput('');
    setSubmitted(false);
    setScore({ correct: 0, total: 0 });
  };

  const shCorrect = submitted && Math.abs(parseInt(superheatInput) - ex.superheat) <= 2;
  const scCorrect = submitted && Math.abs(parseInt(subcoolingInput) - ex.subcooling) <= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gauge Reading Lab</h3>
          <p className="text-sm text-slate-500">Read the gauges. Calculate superheat and subcooling. Diagnose the problem.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">
            {currentIdx + 1} / {exercises.length}
          </span>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            score.total === 0 ? 'bg-slate-100 text-slate-500' :
            score.correct / score.total >= 0.7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {score.correct}/{score.total} correct
          </span>
        </div>
      </div>

      {/* Scenario Card */}
      <div className="bg-white text-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-lg">{ex.title}</h4>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            ex.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
            ex.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {ex.difficulty}
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-4">{ex.refrigerant} &middot; {ex.systemType}</p>

        {/* Conditions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">Outdoor Temp</p>
            <p className="text-2xl font-bold">{ex.outdoorTemp}°F</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">Indoor Temp</p>
            <p className="text-2xl font-bold">{ex.indoorTemp}°F</p>
          </div>
        </div>

        {/* Gauge Readings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 text-center">
            <p className="text-xs text-blue-300 mb-1">Suction Pressure</p>
            <p className="text-3xl font-bold text-blue-200">{ex.suctionPressure}</p>
            <p className="text-xs text-blue-400">psig</p>
          </div>
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
            <p className="text-xs text-red-300 mb-1">Discharge Pressure</p>
            <p className="text-3xl font-bold text-red-200">{ex.dischargePressure}</p>
            <p className="text-xs text-red-400">psig</p>
          </div>
          <div className="bg-white border border-slate-600 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Suction Line Temp</p>
            <p className="text-3xl font-bold">{ex.suctionLineTemp}°F</p>
          </div>
          <div className="bg-white border border-slate-600 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Liquid Line Temp</p>
            <p className="text-3xl font-bold">{ex.liquidLineTemp}°F</p>
          </div>
        </div>
      </div>

      {/* Student Input */}
      {!submitted ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h4 className="font-bold text-slate-800">Your Calculations</h4>
          <p className="text-xs text-slate-500">
            Superheat = Suction Line Temp − Saturation Temp at Suction Pressure<br />
            Subcooling = Saturation Temp at Discharge Pressure − Liquid Line Temp
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Superheat (°F)</label>
              <input
                type="number"
                value={superheatInput}
                onChange={(e) => setSuperheatInput(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold text-center focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Enter superheat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subcooling (°F)</label>
              <input
                type="number"
                value={subcoolingInput}
                onChange={(e) => setSubcoolingInput(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold text-center focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Enter subcooling"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What is your diagnosis?</label>
            <textarea
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              rows={2}
              placeholder="Describe what you think is wrong with this system..."
            />
          </div>

          <button
            onClick={checkAnswer}
            disabled={!superheatInput || !subcoolingInput}
            className="w-full bg-brand-blue-600 text-white font-bold py-3 rounded-lg hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            Check My Answer
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          {/* Results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`rounded-lg p-4 border-2 ${shCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-2 mb-1">
                {shCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <span className="text-sm font-bold">Superheat</span>
              </div>
              <p className="text-sm">Your answer: <span className="font-bold">{superheatInput}°F</span></p>
              <p className="text-sm">Correct: <span className="font-bold">{ex.superheat}°F</span></p>
              <p className="text-xs text-slate-500 mt-1">{ex.suctionLineTemp}°F − {ex.suctionSatTemp}°F = {ex.superheat}°F</p>
            </div>
            <div className={`rounded-lg p-4 border-2 ${scCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-2 mb-1">
                {scCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <span className="text-sm font-bold">Subcooling</span>
              </div>
              <p className="text-sm">Your answer: <span className="font-bold">{subcoolingInput}°F</span></p>
              <p className="text-sm">Correct: <span className="font-bold">{ex.subcooling}°F</span></p>
              <p className="text-xs text-slate-500 mt-1">{ex.liquidSatTemp}°F − {ex.liquidLineTemp}°F = {ex.subcooling}°F</p>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Correct Diagnosis</h4>
            <p className="text-sm font-bold text-brand-blue-700 mb-2">{ex.diagnosis}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{ex.explanation}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-800 mb-1">Correct Action</h4>
            <p className="text-sm text-green-900">{ex.correctAction}</p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentIdx < exercises.length - 1 ? (
              <button onClick={nextExercise} className="flex-1 bg-brand-blue-600 text-white font-bold py-3 rounded-lg hover:bg-brand-blue-700 transition flex items-center justify-center gap-2">
                Next Scenario <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={reset} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Start Over ({score.correct}/{score.total})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
