'use client';

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './LearningWorkspace.module.css';

const PreviewTarget = createContext<HTMLElement | null | undefined>(undefined);

/** A practice's controls stay on the left while their live illustration renders on the right. */
export function LearningPreview({ children }: { children: ReactNode }) {
  const target = useContext(PreviewTarget);
  if (target === undefined) return <>{children}</>;
  return target ? createPortal(children, target) : null;
}

/** Keep both panels mounted so switching views never loses answers or playback state. */
export default function LearningWorkspace({
  instructions,
  preview,
  instructionLabel = 'Instructions & activities',
  previewLabel = 'Lesson preview',
  initialView = 'split',
}: {
  instructions: ReactNode;
  preview: ReactNode;
  instructionLabel?: string;
  previewLabel?: string;
  initialView?: 'split' | 'instructions' | 'preview';
}) {
  const id = useId();
  const [view, setView] = useState(initialView);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('keydown', close);
    };
  }, [expanded]);
  const [previewTarget, setPreviewTarget] = useState<HTMLDivElement | null>(null);

  return (
    <PreviewTarget.Provider value={previewTarget}>
      <div className={`${styles.workspace} min-w-0`} data-learning-workspace data-view={view} data-expanded={expanded ? 'true' : 'false'}>
        <div
          className={`${styles.views} mb-4 gap-2`}
          role="group"
          aria-label="Learning workspace view"
        >
          {(['split', 'instructions', 'preview'] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              aria-pressed={view === panel}
              aria-controls={
                panel === 'split' ? `${id}-instructions ${id}-preview` : `${id}-${panel}`
              }
              onClick={() => setView(panel)}
              className={`min-h-12 flex-1 rounded-xl border px-3 py-3 text-sm font-bold ${view === panel ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            >
              {panel === 'split'
                ? 'Split view'
                : panel === 'instructions'
                  ? instructionLabel
                  : previewLabel}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={expanded}
            onClick={() => {
              setExpanded((previous) => !previous);
              // Give the lesson video/illustration the full available canvas;
              // keep the instruction editor mounted for lossless restoration.
              if (!expanded) setView('preview');
            }}
            className="min-h-12 rounded-xl border border-teal-700 bg-white px-4 py-3 text-sm font-bold text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            {expanded ? 'Exit full screen' : 'Full screen lesson'}
          </button>
        </div>
        <div className={`${styles.panels} grid min-w-0 items-start gap-6`}>
          <section
            id={`${id}-instructions`}
            aria-label={instructionLabel}
            data-active={view !== 'preview'}
            tabIndex={0}
            className={`${styles.panel} min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 sm:p-6`}
          >
            <h2 className="text-lg font-bold text-slate-950">{instructionLabel}</h2>
            {instructions}
          </section>
          <section
            id={`${id}-preview`}
            aria-label={previewLabel}
            data-active={view === 'preview'}
            tabIndex={0}
            className={`${styles.panel} ${styles.preview} min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 sm:p-6`}
          >
            <h2 className="text-lg font-bold text-slate-950">{previewLabel}</h2>
            <div ref={setPreviewTarget} className="space-y-5" />
            {preview}
          </section>
        </div>
      </div>
    </PreviewTarget.Provider>
  );
}
