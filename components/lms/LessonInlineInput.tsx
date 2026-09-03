'use client';

/**
 * LessonInlineInput
 *
 * Embeds a typed-response field directly inside lesson content.
 * Supports three variants:
 *   - short   : single-line text input
 *   - long    : multi-line textarea (auto-grows)
 *   - reflect : reflection prompt with word-count feedback
 *
 * Responses are auto-saved to `lesson_responses` in Supabase with a
 * 1.5s debounce. A saved indicator confirms persistence.
 *
 * Keyboard: Tab moves focus naturally. Ctrl+Enter submits a long/reflect input.
 * ARIA: labelled by the prompt text, live region announces save status.
 */

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { CheckCircle, Clock, AlertCircle, PenLine } from 'lucide-react';

type Variant = 'short' | 'long' | 'reflect';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  /** Unique key within the lesson — used as the response field name in DB */
  fieldKey: string;
  lessonId: string;
  courseId: string;
  /** The prompt shown above the input */
  prompt: string;
  variant?: Variant;
  /** Placeholder text inside the input */
  placeholder?: string;
  /** Minimum word count for reflect variant — shows progress feedback */
  minWords?: number;
  /** Whether this response is required before the lesson can be marked complete */
  required?: boolean;
  /** Called when the response changes — parent can use for completion gating */
  onChange?: (value: string) => void;
}

const DEBOUNCE_MS = 1500;

export function LessonInlineInput({
  fieldKey,
  lessonId,
  courseId,
  prompt,
  variant = 'long',
  placeholder,
  minWords = 30,
  required = false,
  onChange,
}: Props) {
  const [value, setValue] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const labelId = `${uid}-label`;
  const statusId = `${uid}-status`;

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const meetsMinWords = variant === 'reflect' ? wordCount >= minWords : true;

  // Auto-grow textarea
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Load saved response on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from('lesson_responses')
          .select('response_text')
          .eq('lesson_id', lessonId)
          .eq('user_id', user.id)
          .eq('field_key', fieldKey)
          .maybeSingle();

        if (!cancelled && data?.response_text) {
          setValue(data.response_text);
          onChange?.(data.response_text);
          setTimeout(autoGrow, 0);
        }
      } catch {
        /* non-fatal */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, fieldKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save
  const save = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setSaveState('saving');
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('lesson_responses').upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            course_id: courseId,
            field_key: fieldKey,
            response_text: text,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id,field_key' },
        );

        setSaveState(error ? 'error' : 'saved');
        if (!error) setTimeout(() => setSaveState('idle'), 3000);
      } catch {
        setSaveState('error');
      }
    },
    [lessonId, courseId, fieldKey],
  );

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);
      onChange?.(text);
      autoGrow();
      setSaveState('idle');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(text), DEBOUNCE_MS);
    },
    [save, autoGrow, onChange],
  );

  // Ctrl+Enter submits long/reflect
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && variant !== 'short') {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        save(value);
      }
    },
    [variant, value, save],
  );

  const saveIcon = {
    idle: null,
    saving: <Clock className="w-3.5 h-3.5 text-slate-400 animate-spin" aria-hidden />,
    saved: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" aria-hidden />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-500" aria-hidden />,
  }[saveState];

  const saveLabel = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed — check connection',
  }[saveState];

  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-5 focus-within:border-brand-blue-400 focus-within:ring-2 focus-within:ring-brand-blue-100 transition-all">
      {/* Prompt */}
      <div className="flex items-start gap-2 mb-3" id={labelId}>
        <PenLine className="w-4 h-4 text-brand-blue-600 mt-0.5 shrink-0" aria-hidden />
        <p className="text-sm font-semibold text-slate-800 leading-snug">
          {prompt}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </p>
      </div>

      {/* Input */}
      {variant === 'short' ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type your answer…'}
          aria-labelledby={labelId}
          aria-describedby={statusId}
          aria-required={required}
          disabled={!loaded}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent disabled:opacity-50 transition"
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ??
            (variant === 'reflect' ? 'Write your reflection here…' : 'Type your response…')
          }
          aria-labelledby={labelId}
          aria-describedby={statusId}
          aria-required={required}
          aria-multiline="true"
          disabled={!loaded}
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent disabled:opacity-50 resize-none overflow-hidden transition leading-relaxed"
          style={{ minHeight: '96px' }}
        />
      )}

      {/* Footer: word count + save status */}
      <div className="flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-1.5">
          {variant === 'reflect' && (
            <span
              className={`text-xs font-medium ${meetsMinWords ? 'text-emerald-600' : 'text-slate-500'}`}
            >
              {wordCount} / {minWords} words
              {meetsMinWords && (
                <CheckCircle className="inline w-3 h-3 ml-1 text-emerald-500" aria-hidden />
              )}
            </span>
          )}
        </div>
        <div
          id={statusId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-1 text-xs text-slate-500"
        >
          {saveIcon}
          <span>{saveLabel}</span>
          {variant !== 'short' && saveState === 'idle' && value.trim() && (
            <span className="text-slate-400">Ctrl+Enter to save</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonInlineInput;
