'use client';

import { useState } from 'react';
import { SuggestionCard } from './SuggestionCard';
import type { SuggestedAnswer } from '@/lib/assistant/matchFieldToSource';

type Props = {
  label: string;
  fieldName: string;
  type?: 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'select';
  required?: boolean;
  options?: string[]; // for select/radio
  suggestion?: SuggestedAnswer;
  value: string;
  onChange: (value: string) => void;
};

export function AssistantField({
  label,
  fieldName,
  type = 'text',
  required,
  options,
  suggestion,
  value,
  onChange,
}: Props) {
  const [skipped, setSkipped] = useState(false);
  const showSuggestion = suggestion && !skipped && !value;

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-800 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={fieldName}
          rows={5}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 resize-none"
        />
      ) : type === 'select' && options ? (
        <select
          name={fieldName}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={fieldName}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
        />
      )}

      {showSuggestion && (
        <SuggestionCard
          suggestion={suggestion}
          onUse={(val) => onChange(val)}
          onSkip={() => setSkipped(true)}
        />
      )}
    </div>
  );
}
