'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyWorkbookAnswers, type WorkbookAnswers } from '@/lib/lms/workbook-validation';
import type { WorkbookResponse } from '@/lib/lms/digital-workbooks';

type Draft = { answers: WorkbookAnswers; reviewed: boolean };
export function useWorkbookSave(
  sectionId: string,
  initial?: WorkbookResponse,
  readOnly = false,
  ownerId = '',
) {
  const [draft, setDraft] = useState<Draft>(() => ({
    answers: { ...emptyWorkbookAnswers(), ...initial?.answers },
    reviewed: initial?.reviewed ?? false,
  }));
  const [status, setStatus] = useState(initial ? 'Saved to your account' : 'Ready to write');
  const [error, setError] = useState(false);
  const current = useRef(draft);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const version = useRef(initial?.version ?? 0);
  const running = useRef<Promise<boolean> | null>(null);
  const conflict = useRef(false);
  const save = useCallback((): Promise<boolean> => {
    if (running.current) return running.current;
    if (readOnly || savedRevision.current === revision.current) return Promise.resolve(true);
    if (conflict.current) return Promise.resolve(false);
    setStatus('Saving…');
    setError(false);
    running.current = Promise.resolve().then(async () => {
      try {
        while (savedRevision.current < revision.current) {
          const sentRevision = revision.current;
          const response = await fetch(`/api/workbooks/sections/${sectionId}`, {
            method: 'POST',
            credentials: 'same-origin',
            keepalive: true,
            headers: { 'Content-Type': 'application/json', 'x-workbook-owner': ownerId },
            body: JSON.stringify({ ...current.current, expectedVersion: version.current }),
            signal: AbortSignal.timeout(15000),
          });
          const body = await response.json();
          if (!response.ok) {
            if (response.status === 409) conflict.current = true;
            throw new Error(
              body.error ||
                'Save failed. Your changes are still on this page. Retry before leaving.',
            );
          }
          if (!Number.isInteger(body.version) || body.section_id !== sectionId)
            throw new Error('Save was not confirmed. Please retry.');
          version.current = body.version;
          savedRevision.current = sentRevision;
        }
        setStatus('Saved to your account');
        return true;
      } catch (cause) {
        setError(true);
        setStatus(
          cause instanceof Error ? cause.message : 'Save failed. Please retry before leaving.',
        );
        return false;
      } finally {
        running.current = null;
      }
    });
    return running.current;
  }, [sectionId, readOnly, ownerId]);
  const edit = useCallback(
    (next: Draft) => {
      if (readOnly) return;
      current.current = next;
      revision.current += 1;
      setDraft(next);
      if (!conflict.current) setStatus('Unsaved changes');
      setError(conflict.current);
    },
    [readOnly],
  );
  useEffect(() => {
    if (revision.current === savedRevision.current) return;
    const timer = setTimeout(() => {
      void save();
    }, 1000);
    return () => clearTimeout(timer);
  }, [draft, save]);
  useEffect(() => {
    const leaving = (event: BeforeUnloadEvent) => {
      if (revision.current > savedRevision.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const flush = () => {
      void save();
    };
    window.addEventListener('beforeunload', leaving);
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    return () => {
      window.removeEventListener('beforeunload', leaving);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('online', flush);
      // A dashboard link can unmount this editor before the debounce expires.
      // Keep the final request alive across that navigation as well.
      void save();
    };
  }, [save]);
  return { draft, edit, save, status, error };
}
