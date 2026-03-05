'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface DropZone {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface ComponentLabelingProps {
  title: string;
  description?: string;
  diagramSrc: string;
  zones: DropZone[];
  onComplete?: (score: number, passed: boolean) => void;
}

/**
 * Tap-to-place labeling: tap a label, then tap where it goes on the diagram.
 * Works on phone and desktop — no drag required.
 */
export function ComponentLabeling({ title, description, diagramSrc, zones, onComplete }: ComponentLabelingProps) {
  const [placements, setPlacements] = useState<Record<string, string | null>>({});
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [shuffledLabels] = useState(() =>
    zones.map(z => z.label).sort(() => Math.random() - 0.5)
  );

  const placedLabels = new Set(Object.values(placements).filter(Boolean));
  const availableLabels = shuffledLabels.filter(l => !placedLabels.has(l));

  function handleLabelTap(label: string) {
    if (submitted) return;
    setSelectedLabel(prev => prev === label ? null : label);
  }

  function handleZoneTap(zoneId: string) {
    if (submitted) return;
    if (selectedLabel) {
      setPlacements(prev => {
        const cleaned: Record<string, string | null> = {};
        for (const [k, v] of Object.entries(prev)) {
          cleaned[k] = v === selectedLabel ? null : v;
        }
        cleaned[zoneId] = selectedLabel;
        return cleaned;
      });
      setSelectedLabel(null);
    } else if (placements[zoneId]) {
      setPlacements(prev => ({ ...prev, [zoneId]: null }));
    }
  }

  function handleSubmit() {
    setSubmitted(true);
    const correct = zones.filter(z => placements[z.id] === z.label).length;
    const score = Math.round((correct / zones.length) * 100);
    onComplete?.(score, score >= 70);
  }

  function handleRetry() {
    setPlacements({});
    setSelectedLabel(null);
    setSubmitted(false);
  }

  const correctCount = zones.filter(z => placements[z.id] === z.label).length;
  const score = Math.round((correctCount / zones.length) * 100);
  const allPlaced = zones.every(z => placements[z.id]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded">Activity</span>
        <h3 className="text-xl font-bold text-gray-900 mt-2">{title}</h3>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
        {!submitted && (
          <p className="text-sm text-brand-blue-600 font-medium mt-2">
            {selectedLabel
              ? `Now tap a spot on the diagram to place "${selectedLabel}"`
              : 'Tap a label below, then tap where it belongs on the diagram'}
          </p>
        )}
      </div>

      {/* Diagram with tap zones */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 mb-4"
        style={{ aspectRatio: '16/10' }}>
        <img src={diagramSrc} alt="System diagram" className="w-full h-full object-contain" />

        {zones.map(zone => {
          const placed = placements[zone.id];
          const isCorrect = submitted && placed === zone.label;
          const isWrong = submitted && placed && placed !== zone.label;

          return (
            <button
              key={zone.id}
              onClick={() => handleZoneTap(zone.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${submitted ? '' : 'cursor-pointer'}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            >
              {placed ? (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-bold shadow-md whitespace-nowrap ${
                  isCorrect ? 'bg-green-100 border-green-500 text-green-800' :
                  isWrong ? 'bg-red-100 border-red-400 text-red-700' :
                  'bg-white border-brand-blue-400 text-gray-800 hover:bg-brand-blue-50'
                }`}>
                  {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  {isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  {placed}
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-lg font-bold ${
                  selectedLabel
                    ? 'border-brand-blue-400 bg-brand-blue-50 text-brand-blue-600 animate-pulse'
                    : 'border-gray-300 bg-white/90 text-gray-400'
                }`}>
                  ?
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Label bank */}
      {!submitted && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tap a label to select it</p>
          <div className="flex flex-wrap gap-2">
            {availableLabels.map(label => (
              <button
                key={label}
                onClick={() => handleLabelTap(label)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedLabel === label
                    ? 'bg-brand-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-brand-blue-50 hover:text-brand-blue-700 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
            {availableLabels.length === 0 && !submitted && (
              <p className="text-sm text-gray-400 italic">All placed. Tap a label on the diagram to remove it.</p>
            )}
          </div>
        </div>
      )}

      {!submitted ? (
        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={!allPlaced}
            className="px-6 py-2.5 rounded-xl bg-brand-blue-600 text-white font-semibold text-sm hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Check Answers
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-xl ${score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-lg font-bold ${score >= 70 ? 'text-green-800' : 'text-red-800'}`}>
                {score === 100 ? 'Perfect!' : score >= 70 ? 'Nice work!' : 'Review and try again'}
              </p>
              <p className={`text-sm ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                {correctCount}/{zones.length} correct ({score}%)
              </p>
            </div>
            {score < 100 && (
              <button onClick={handleRetry} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
