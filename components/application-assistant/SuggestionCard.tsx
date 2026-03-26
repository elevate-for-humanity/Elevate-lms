'use client';

import { useState } from 'react';
import { CheckCircle, Edit2, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';
import type { SuggestedAnswer } from '@/lib/assistant/matchFieldToSource';

type Props = {
  suggestion: SuggestedAnswer;
  onUse: (value: string) => void;
  onSkip: () => void;
};

export function SuggestionCard({ suggestion, onUse, onSkip }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(suggestion.suggestion);
  const [used, setUsed] = useState(false);
  const [showAlts, setShowAlts] = useState(false);

  const confidenceColor =
    suggestion.confidence >= 0.9 ? 'text-green-600 bg-green-50 border-green-200' :
    suggestion.confidence >= 0.7 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
    'text-gray-500 bg-gray-50 border-gray-200';

  const handleUse = (value: string) => {
    onUse(value);
    setUsed(true);
  };

  if (used) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 py-1">
        <CheckCircle className="w-4 h-4" />
        <span>Answer applied</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 text-sm ${confidenceColor} mt-1`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
          Suggested · {Math.round(suggestion.confidence * 100)}% match
        </span>
        <span className="text-xs opacity-60">{suggestion.sourceType}</span>
      </div>

      {editing ? (
        <textarea
          className="w-full border border-gray-300 rounded p-2 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
          rows={4}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
        />
      ) : (
        <p className="text-gray-800 whitespace-pre-wrap line-clamp-3">{suggestion.suggestion}</p>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          onClick={() => handleUse(editing ? editValue : suggestion.suggestion)}
          className="flex items-center gap-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <CheckCircle className="w-3 h-3" /> Use
        </button>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 border border-gray-300 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <Edit2 className="w-3 h-3" /> {editing ? 'Cancel' : 'Edit'}
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 px-2 py-1.5 text-xs transition-colors"
        >
          <SkipForward className="w-3 h-3" /> Skip
        </button>

        {suggestion.alternatives && suggestion.alternatives.length > 0 && (
          <button
            onClick={() => setShowAlts(!showAlts)}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-600 px-2 py-1.5 text-xs transition-colors ml-auto"
          >
            Alternatives {showAlts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showAlts && suggestion.alternatives && (
        <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
          {suggestion.alternatives.map((alt, i) => (
            <button
              key={i}
              onClick={() => handleUse(alt)}
              className="w-full text-left text-xs text-gray-700 hover:bg-white px-2 py-1.5 rounded transition-colors"
            >
              {alt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
