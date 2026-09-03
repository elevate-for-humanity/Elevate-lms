'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Check, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface PrefillField {
  key: string;
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'document' | 'profile_match';
  canSaveToProfile: boolean;
}

interface Props {
  /** ID of the just-uploaded document record */
  documentId: string;
  /** Document type hint passed to the AI (e.g. "government_id") */
  documentType?: string;
  /** Called after the user confirms and fields are saved */
  onConfirmed?: (savedFields: string[]) => void;
  /** Called if the user dismisses the panel without saving */
  onDismiss?: () => void;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-slate-100 text-slate-600',
};

export default function DocumentAIPrefillPanel({
  documentId,
  documentType,
  onConfirmed,
  onDismiss,
}: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'done' | 'error' | 'empty'>(
    'loading',
  );
  const [fields, setFields] = useState<PrefillField[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [message, setMessage] = useState('');

  const fetchPrefill = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/documents/ai-prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, documentType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'AI extraction failed');
        setStatus('error');
        return;
      }

      if (!data.fields?.length) {
        setMessage(data.message ?? 'No fields could be extracted from this document.');
        setStatus('empty');
        return;
      }

      const saveable = (data.fields as PrefillField[]).filter((f) => f.canSaveToProfile);
      setFields(saveable);

      // Pre-check high-confidence fields
      const autoChecked = new Set(
        saveable.filter((f) => f.confidence === 'high').map((f) => f.key),
      );
      setCheckedKeys(autoChecked);

      // Seed editable values
      const vals: Record<string, string> = {};
      for (const f of saveable) vals[f.key] = f.value;
      setEditedValues(vals);

      setStatus('ready');
    } catch {
      setErrorMsg('Could not reach AI service. You can fill in fields manually.');
      setStatus('error');
    }
  }, [documentId, documentType]);

  useEffect(() => {
    fetchPrefill();
  }, [fetchPrefill]);

  const toggleField = (key: string) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleConfirm = async () => {
    const toSave = fields
      .filter((f) => checkedKeys.has(f.key))
      .map((f) => ({ key: f.key, value: editedValues[f.key] ?? f.value }));

    if (toSave.length === 0) {
      onDismiss?.();
      return;
    }

    setStatus('saving');
    try {
      const res = await fetch('/api/documents/ai-prefill', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toSave }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to save fields');
        setStatus('error');
        return;
      }

      setStatus('done');
      onConfirmed?.(data.saved ?? []);
    } catch {
      setErrorMsg('Failed to save. Please try again.');
      setStatus('error');
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center gap-3 text-sm text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        AI is reading your document and extracting fields…
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3 text-sm text-slate-600">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{message}</span>
        <button onClick={onDismiss} className="ml-auto text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-sm text-red-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{errorMsg}</span>
        <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3 text-sm text-green-800">
        <Check className="w-4 h-4 flex-shrink-0" />
        Profile updated with extracted fields.
      </div>
    );
  }

  // status === 'ready' | 'saving'
  return (
    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-blue-100 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-blue-900 flex-1">
          AI extracted {fields.length} field{fields.length !== 1 ? 's' : ''} from your document
        </span>
        <span className="text-xs text-blue-600 mr-2">Review &amp; confirm to save to your profile</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-blue-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-xs text-blue-700 mb-3">
            Check the fields you want to save. Edit any value before confirming.
          </p>

          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  checkedKeys.has(field.key)
                    ? 'border-blue-300 bg-white'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  id={`prefill-${field.key}`}
                  checked={checkedKeys.has(field.key)}
                  onChange={() => toggleField(field.key)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 flex-shrink-0"
                />

                {/* Label + editable value */}
                <label
                  htmlFor={`prefill-${field.key}`}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <span className="block text-xs font-medium text-slate-500 mb-0.5">
                    {field.label}
                  </span>
                  <input
                    type="text"
                    value={editedValues[field.key] ?? field.value}
                    onChange={(e) =>
                      setEditedValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm text-slate-900 bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none py-0.5"
                  />
                </label>

                {/* Confidence badge */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    CONFIDENCE_COLORS[field.confidence] ?? CONFIDENCE_COLORS.medium
                  }`}
                >
                  {field.confidence}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={status === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save {checkedKeys.size} field{checkedKeys.size !== 1 ? 's' : ''} to profile
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={status === 'saving'}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
