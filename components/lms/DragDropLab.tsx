'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, GripVertical } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

export interface DropZone {
  id: string;
  label: string;
  /** Position as percentage of container (0-100) */
  x: number;
  y: number;
  /** Which draggable ID is the correct match */
  correctItemId: string;
}

export interface DraggableItem {
  id: string;
  label: string;
  /** Color for the drag chip */
  color?: string;
}

export interface LabConfig {
  id: string;
  title: string;
  instruction: string;
  /** Background image URL for the diagram */
  backgroundImage?: string;
  /** Background color if no image */
  backgroundColor?: string;
  dropZones: DropZone[];
  draggables: DraggableItem[];
  /** Explanation shown after completing correctly */
  successMessage: string;
}

interface Props {
  config: LabConfig;
  onComplete?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

export default function DragDropLab({ config, onComplete }: Props) {
  const [placements, setPlacements] = useState<Record<string, string | null>>({});
  const [revealed, setRevealed] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Which draggables are already placed
  const placedItemIds = new Set(Object.values(placements).filter(Boolean));

  // Available draggables (not yet placed)
  const availableItems = config.draggables.filter(d => !placedItemIds.has(d.id));

  // ── Touch/Mouse drag handling ──

  const handleDragStart = useCallback((itemId: string) => {
    setDragItem(itemId);
  }, []);

  const handleDropOnZone = useCallback((zoneId: string) => {
    if (!dragItem) return;
    setPlacements(prev => {
      // Remove item from any previous zone
      const updated = { ...prev };
      for (const [k, v] of Object.entries(updated)) {
        if (v === dragItem) updated[k] = null;
      }
      updated[zoneId] = dragItem;
      return updated;
    });
    setDragItem(null);
  }, [dragItem]);

  const handleRemoveFromZone = useCallback((zoneId: string) => {
    if (revealed) return;
    setPlacements(prev => ({ ...prev, [zoneId]: null }));
  }, [revealed]);

  const handleCheck = useCallback(() => {
    let correct = 0;
    for (const zone of config.dropZones) {
      if (placements[zone.id] === zone.correctItemId) correct++;
    }
    const pct = Math.round((correct / config.dropZones.length) * 100);
    setScore(pct);
    setRevealed(true);
    if (pct === 100 && onComplete) onComplete();
  }, [placements, config.dropZones, onComplete]);

  const handleReset = useCallback(() => {
    setPlacements({});
    setRevealed(false);
    setScore(null);
    setDragItem(null);
  }, []);

  const allPlaced = config.dropZones.every(z => placements[z.id]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-800 text-white">
        <h3 className="text-lg font-bold">{config.title}</h3>
        <p className="text-sm text-slate-300 mt-1">{config.instruction}</p>
      </div>

      {/* Lab area */}
      <div className="p-4 sm:p-6">
        {/* Diagram with drop zones */}
        <div
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden border border-slate-300"
          style={{
            aspectRatio: '16/10',
            backgroundColor: config.backgroundColor || '#0A1628',
            backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {config.dropZones.map(zone => {
            const placedItem = placements[zone.id]
              ? config.draggables.find(d => d.id === placements[zone.id])
              : null;
            const isCorrect = revealed && placements[zone.id] === zone.correctItemId;
            const isWrong = revealed && placements[zone.id] && placements[zone.id] !== zone.correctItemId;

            return (
              <div
                key={zone.id}
                onClick={() => {
                  if (placedItem && !revealed) {
                    handleRemoveFromZone(zone.id);
                  } else if (dragItem) {
                    handleDropOnZone(zone.id);
                  }
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDropOnZone(zone.id)}
                className={`absolute flex flex-col items-center gap-1 cursor-pointer transition-all duration-200`}
                style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {/* Zone label */}
                <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded whitespace-nowrap">
                  {zone.label}
                </span>

                {/* Drop target */}
                <div
                  className={`w-28 sm:w-36 h-10 sm:h-12 rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
                    isCorrect
                      ? 'border-green-400 bg-green-500/30'
                      : isWrong
                      ? 'border-red-400 bg-red-500/30'
                      : placedItem
                      ? 'border-white/60 bg-white/20'
                      : dragItem
                      ? 'border-yellow-400 bg-yellow-400/20 animate-pulse'
                      : 'border-white/40 bg-white/10'
                  }`}
                >
                  {placedItem ? (
                    <span className="text-sm font-semibold text-white flex items-center gap-1">
                      {placedItem.label}
                      {isCorrect && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {isWrong && <XCircle className="w-4 h-4 text-red-400" />}
                    </span>
                  ) : (
                    <span className="text-xs text-white/50">Drop here</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Draggable items tray */}
        {!revealed && (
          <div className="mt-4">
            <p className="text-sm text-slate-500 mb-2">
              {dragItem ? 'Tap a drop zone to place it' : 'Tap a component to pick it up'}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleDragStart(item.id)}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all min-h-[48px] ${
                    dragItem === item.id
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-800 ring-2 ring-yellow-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-blue-400 hover:bg-brand-blue-50'
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  {item.label}
                </button>
              ))}
              {availableItems.length === 0 && !revealed && (
                <p className="text-sm text-slate-400 italic">All components placed</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          {!revealed && (
            <button
              onClick={handleCheck}
              disabled={!allPlaced}
              className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                allPlaced
                  ? 'bg-brand-blue-600 hover:bg-brand-blue-700'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Check Answers
            </button>
          )}
          {revealed && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-brand-blue-600 hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Try Again
              </button>
            </>
          )}
        </div>

        {/* Results */}
        {revealed && score !== null && (
          <div className={`mt-4 p-5 rounded-xl border-2 ${
            score === 100
              ? 'bg-green-50 border-green-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-start gap-3">
              {score === 100 ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-bold text-lg">
                  {score === 100 ? 'All correct!' : `${score}% — Review and try again`}
                </p>
                {score === 100 && (
                  <p className="text-green-700 mt-1">{config.successMessage}</p>
                )}
                {score < 100 && (
                  <p className="text-amber-700 mt-1">
                    Look at the red markers to see which placements were wrong. Tap &quot;Try Again&quot; to redo.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
