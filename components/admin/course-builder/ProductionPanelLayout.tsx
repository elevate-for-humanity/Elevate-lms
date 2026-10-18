'use client';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './ProductionPanelLayout.module.css';
import { ResizableWorkspace } from '@/components/studio/ResizableWorkspace';

/** Reuses the accessible pointer/keyboard splitter, including its phone layout. */
export default function ProductionPanelLayout({
  outline,
  operations,
  children,
}: {
  outline: ReactNode;
  operations?: ReactNode;
  children: ReactNode;
}) {
  const [mobilePane, setMobilePane] = useState<'outline' | 'preview' | 'operations'>('preview');
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  useEffect(() => {
    if (!previewExpanded) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewExpanded(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [previewExpanded]);
  return (
    <div className={styles.root} data-mobile-pane={mobilePane}>
      <nav className={styles.mobileTabs} aria-label="Mobile production workspace">
        {(['outline', 'preview', 'operations'] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            aria-pressed={mobilePane === pane}
            onClick={() => {
              setMobilePane(pane);
              setOutlineOpen(pane === 'outline');
              setOperationsOpen(pane === 'operations');
            }}
            className="min-h-11 rounded-lg border border-cyan-700 px-3 text-sm font-bold text-cyan-200"
          >
            {pane === 'outline' ? 'Outline' : pane === 'preview' ? 'Preview' : 'Operations'}
          </button>
        ))}
      </nav>
      <ResizableWorkspace
        className={`${styles.operations} h-[75dvh] min-h-[38rem]`}
        title="Production operations"
        initialPanelSize={30}
        open={operationsOpen}
        onOpenChange={setOperationsOpen}
        panel={operations}
      >
        <ResizableWorkspace
          className={`${styles.outline} h-full`}
          title="Course outline"
          initialPanelSize={25}
          panelPosition="start"
          open={outlineOpen}
          onOpenChange={setOutlineOpen}
          panel={outline}
        >
          <div
            className={
              previewExpanded ? 'fixed inset-0 z-[110] overflow-auto bg-slate-950 p-3' : ''
            }
          >
            <button
              type="button"
              onClick={() => setPreviewExpanded((value) => !value)}
              aria-pressed={previewExpanded}
              className="m-2 min-h-11 rounded-lg border border-cyan-600 px-3 text-sm font-bold text-cyan-200"
            >
              {previewExpanded ? 'Restore preview' : 'Expand preview'}
            </button>
            {children}
          </div>
        </ResizableWorkspace>
      </ResizableWorkspace>
    </div>
  );
}
