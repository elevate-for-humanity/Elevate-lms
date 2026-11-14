'use client';

/**
 * useApplicationDraft
 *
 * Persists multi-step application form state to localStorage so users can
 * close the browser and resume where they left off.
 *
 * Usage:
 *   const { draft, saveDraft, clearDraft, hasDraft } = useApplicationDraft<MyForm>('barber-apply');
 *
 * - Call saveDraft(values) on every step advance.
 * - On mount, check hasDraft and offer to restore.
 * - Call clearDraft() after successful submission.
 */

import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'elevate_app_draft_';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type DraftEnvelope<T> = {
  data: T;
  step: number;
  savedAt: number; // epoch ms
};

export function useApplicationDraft<T extends object>(key: string) {
  const storageKey = `${PREFIX}${key}`;
  const [draft, setDraft] = useState<DraftEnvelope<T> | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: DraftEnvelope<T> = JSON.parse(raw);
        // Expire after 7 days
        if (Date.now() - parsed.savedAt < EXPIRY_MS) {
          setDraft(parsed);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // corrupt storage — ignore
    }
    setLoaded(true);
  }, [storageKey]);

  const saveDraft = useCallback(
    (data: T, step: number) => {
      const envelope: DraftEnvelope<T> = { data, step, savedAt: Date.now() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(envelope));
        setDraft(envelope);
      } catch {
        // storage full or unavailable — silent
      }
    },
    [storageKey],
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setDraft(null);
  }, [storageKey]);

  return {
    draft,
    hasDraft: loaded && draft !== null,
    savedStep: draft?.step ?? 0,
    savedData: draft?.data ?? null,
    savedAt: draft ? new Date(draft.savedAt) : null,
    saveDraft,
    clearDraft,
    loaded,
  };
}
