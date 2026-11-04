'use client';

import { createContext, useContext, useId, useState, type ReactNode } from 'react';
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
}: {
  instructions: ReactNode;
  preview: ReactNode;
  instructionLabel?: string;
  previewLabel?: string;
}) {
  const id = useId();
  const [view, setView] = useState<'instructions' | 'preview'>('instructions');
  const [previewTarget, setPreviewTarget] = useState<HTMLDivElement | null>(null);

  return (
    <PreviewTarget.Provider value={previewTarget}>
      <div className={`${styles.workspace} min-w-0`} data-learning-workspace>
        <div
          className={`${styles.views} mb-4 gap-2`}
          role="group"
          aria-label="Learning workspace view"
        >
          {(['instructions', 'preview'] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              aria-pressed={view === panel}
              aria-controls={`${id}-${panel}`}
              onClick={() => setView(panel)}
              className={`min-h-12 flex-1 rounded-xl border px-3 py-3 text-sm font-bold ${view === panel ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            >
              {panel === 'instructions' ? instructionLabel : previewLabel}
            </button>
          ))}
        </div>
        <div className={`${styles.panels} grid min-w-0 items-start gap-6`}>
          <section
            id={`${id}-instructions`}
            aria-label={instructionLabel}
            data-active={view === 'instructions'}
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
