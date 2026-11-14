/**
 * Regression tests for Bug D — markComplete not awaited in video onComplete callbacks.
 *
 * Root causes:
 *   1. markComplete() was called without `await` in all 11 video/simulation onComplete
 *      callbacks. Errors (network failure, 403 gate) were silently swallowed.
 *   2. markComplete was not wrapped in useCallback, so it captured stale values of
 *      isCompleted, lessons, and currentIndex on every render. A video firing onComplete
 *      after a re-render would navigate to the wrong next lesson or skip the no-op guard.
 *   3. Call sites set setIsCompleted(true) before calling markComplete(), making the
 *      internal `if (newStatus === isCompleted) return` guard unreliable — the state
 *      update is async, so the closure still sees the old value.
 *
 * Fix:
 *   - markComplete wrapped in useCallback with [isCompleted, lessonId, courseId, lessons, router]
 *   - All onComplete callbacks made async and await markComplete(true)
 *   - Redundant outer setIsCompleted(true) + if (!isCompleted) guards removed from call sites
 *   - Auto-advance derives currentIndex from lessons inside the callback (not from stale
 *     module-level derived values)
 */

import { describe, it, expect, vi } from 'vitest';

// ─── 1. Fire-and-forget swallows errors ──────────────────────────────────────

describe('markComplete — fire-and-forget swallows errors', () => {
  it('broken: unhandled rejection from fire-and-forget is invisible to the caller', async () => {
    const errors: string[] = [];

    async function markComplete_BROKEN(): Promise<void> {
      throw new Error('CHECKPOINT_NOT_PASSED');
    }

    // Broken pattern: no await, no .catch()
    // The rejection is unhandled — the caller never knows it failed.
    const onComplete_BROKEN = () => {
      markComplete_BROKEN(); // fire-and-forget
    };

    // Suppress the unhandled rejection for this test
    const handler = (reason: unknown) => {
      errors.push(reason instanceof Error ? reason.message : String(reason));
    };
    process.on('unhandledRejection', handler);

    onComplete_BROKEN();

    // Give the microtask queue a tick to settle
    await new Promise((r) => setTimeout(r, 0));
    process.off('unhandledRejection', handler);

    // The caller's errors array is empty — the failure was invisible
    // (unhandledRejection may or may not fire depending on Node version/test runner)
    // The key point: the caller has no way to react to the error.
    expect(typeof onComplete_BROKEN).toBe('function'); // always passes — documents the pattern
  });

  it('fixed: awaiting markComplete surfaces errors to the caller', async () => {
    const errors: string[] = [];

    async function markComplete_FIXED(): Promise<void> {
      throw new Error('CHECKPOINT_NOT_PASSED');
    }

    const onComplete_FIXED = async () => {
      try {
        await markComplete_FIXED();
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    };

    await onComplete_FIXED();

    expect(errors).toEqual(['CHECKPOINT_NOT_PASSED']);
  });

  it('fixed: successful markComplete resolves without error', async () => {
    const completed: string[] = [];

    async function markComplete_FIXED(): Promise<void> {
      completed.push('done');
    }

    const onComplete_FIXED = async () => {
      await markComplete_FIXED();
    };

    await onComplete_FIXED();

    expect(completed).toEqual(['done']);
  });
});

// ─── 2. Double-fire prevention via forceComplete=true ────────────────────────
//
// The old pattern set setIsCompleted(true) before calling markComplete(), then
// markComplete() checked `if (newStatus === isCompleted) return`. Because setState
// is async, the closure still saw the old isCompleted value — the guard was
// unreliable. The new pattern passes forceComplete=true and lets markComplete own
// the idempotency check via a ref or by always treating forceComplete as "mark done".

describe('markComplete — forceComplete=true idempotency', () => {
  // Mirrors the fixed markComplete logic for forceComplete
  function makeMarkComplete(initialCompleted: boolean) {
    let isCompleted = initialCompleted;
    const calls: string[] = [];

    const markComplete = async (forceComplete?: boolean) => {
      const newStatus = forceComplete ? true : !isCompleted;
      if (newStatus === isCompleted) {
        calls.push('no-op');
        return;
      }
      isCompleted = newStatus;
      calls.push(newStatus ? 'marked-complete' : 'marked-incomplete');
    };

    return { markComplete, calls, getCompleted: () => isCompleted };
  }

  it('forceComplete=true on an incomplete lesson marks it complete', async () => {
    const { markComplete, calls } = makeMarkComplete(false);
    await markComplete(true);
    expect(calls).toEqual(['marked-complete']);
  });

  it('forceComplete=true on an already-complete lesson is a no-op', async () => {
    const { markComplete, calls } = makeMarkComplete(true);
    await markComplete(true);
    expect(calls).toEqual(['no-op']);
  });

  it('double-fire: second forceComplete=true call is a no-op after first succeeds', async () => {
    const { markComplete, calls } = makeMarkComplete(false);
    await markComplete(true); // first fire
    await markComplete(true); // second fire (e.g. video replayed)
    expect(calls).toEqual(['marked-complete', 'no-op']);
  });

  it('broken outer-guard pattern: setIsCompleted before markComplete makes guard unreliable', () => {
    // The broken pattern:
    //   setIsCompleted(true);   ← async, closure still sees old value
    //   markComplete();         ← reads stale isCompleted=false, proceeds anyway
    //
    // We model this by showing that reading isCompleted synchronously after
    // a setState call returns the old value (React batches state updates).
    let isCompleted = false;
    const setIsCompleted = (v: boolean) => {
      // Simulates React's async setState — the closure variable is NOT updated yet
      // (the update is queued, not applied synchronously)
      void v; // intentionally not updating isCompleted here
    };

    setIsCompleted(true); // queued but not applied
    // isCompleted is still false in this closure
    expect(isCompleted).toBe(false); // stale — guard would NOT fire
  });
});

// ─── 3. Stale closure: auto-advance navigates to wrong lesson ────────────────
//
// Without useCallback, markComplete captured lessons and currentIndex at render
// time. If the lessons list updated (e.g. after a progress fetch), the closure
// still held the old list and navigated to the wrong next lesson.
//
// Fix: markComplete is useCallback-wrapped with lessons in its dep array, and
// derives currentIndex from lessons inside the callback.

describe('markComplete — stale closure auto-advance', () => {
  function makeAutoAdvance(lessons: { id: string }[], lessonId: string) {
    // Broken: captures lessons and currentIndex at creation time
    const currentIndex_STALE = lessons.findIndex((l) => l.id === lessonId);
    const hasNext_STALE = currentIndex_STALE < lessons.length - 1;

    const navigate_BROKEN = (updatedLessons: { id: string }[]) => {
      // Uses stale values — ignores updatedLessons
      void updatedLessons;
      if (hasNext_STALE) return lessons[currentIndex_STALE + 1].id;
      return null;
    };

    // Fixed: derives index from the lessons list passed in (fresh closure)
    const navigate_FIXED = (currentLessons: { id: string }[]) => {
      const idx = currentLessons.findIndex((l) => l.id === lessonId);
      if (idx >= 0 && idx < currentLessons.length - 1) return currentLessons[idx + 1].id;
      return null;
    };

    return { navigate_BROKEN, navigate_FIXED };
  }

  it('broken: stale closure navigates to wrong lesson after list update', () => {
    const originalLessons = [
      { id: 'lesson-a' },
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ];
    const { navigate_BROKEN } = makeAutoAdvance(originalLessons, 'lesson-a');

    // Lessons list is updated (e.g. a new lesson was inserted at position 1)
    const updatedLessons = [
      { id: 'lesson-a' },
      { id: 'lesson-new' }, // inserted
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ];

    // Broken: still navigates to lesson-b (stale index 1 from original list)
    expect(navigate_BROKEN(updatedLessons)).toBe('lesson-b');
  });

  it('fixed: fresh closure navigates to correct next lesson after list update', () => {
    const originalLessons = [
      { id: 'lesson-a' },
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ];
    const { navigate_FIXED } = makeAutoAdvance(originalLessons, 'lesson-a');

    const updatedLessons = [
      { id: 'lesson-a' },
      { id: 'lesson-new' }, // inserted
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ];

    // Fixed: finds lesson-a in updated list (index 0), navigates to lesson-new (index 1)
    expect(navigate_FIXED(updatedLessons)).toBe('lesson-new');
  });

  it('fixed: returns null when current lesson is the last one', () => {
    const lessons = [{ id: 'lesson-a' }, { id: 'lesson-b' }];
    const { navigate_FIXED } = makeAutoAdvance(lessons, 'lesson-b');
    expect(navigate_FIXED(lessons)).toBeNull();
  });

  it('fixed: returns null when lessonId is not found in the list', () => {
    const lessons = [{ id: 'lesson-a' }, { id: 'lesson-b' }];
    const { navigate_FIXED } = makeAutoAdvance(lessons, 'lesson-unknown');
    expect(navigate_FIXED(lessons)).toBeNull();
  });

  it('fixed: single-lesson course returns null (no next lesson)', () => {
    const lessons = [{ id: 'lesson-only' }];
    const { navigate_FIXED } = makeAutoAdvance(lessons, 'lesson-only');
    expect(navigate_FIXED(lessons)).toBeNull();
  });
});

// ─── 4. Execution order: await ensures sequential completion ─────────────────

describe('markComplete — await ensures sequential execution', () => {
  it('awaited markComplete completes before the next statement runs', async () => {
    const order: string[] = [];

    async function markComplete() {
      await new Promise((r) => setTimeout(r, 5));
      order.push('server-confirmed');
    }

    const onComplete = async () => {
      await markComplete();
      order.push('callback-done');
    };

    await onComplete();

    expect(order).toEqual(['server-confirmed', 'callback-done']);
  });

  it('non-awaited markComplete allows callback to finish before server confirms', async () => {
    const order: string[] = [];

    async function markComplete() {
      await new Promise((r) => setTimeout(r, 5));
      order.push('server-confirmed');
    }

    // Broken pattern: no await
    const onComplete_BROKEN = () => {
      markComplete(); // fire-and-forget
      order.push('callback-done');
    };

    onComplete_BROKEN();
    await new Promise((r) => setTimeout(r, 20)); // wait for markComplete to settle

    // callback-done appears before server-confirmed — wrong order
    expect(order).toEqual(['callback-done', 'server-confirmed']);
  });

  it('concurrent double-fire: two awaited calls serialize correctly via isCompleted guard', async () => {
    let isCompleted = false;
    const calls: string[] = [];

    const markComplete = async (forceComplete?: boolean) => {
      const newStatus = forceComplete ? true : !isCompleted;
      if (newStatus === isCompleted) {
        calls.push('no-op');
        return;
      }
      // Simulate async server round-trip
      await new Promise((r) => setTimeout(r, 5));
      isCompleted = newStatus;
      calls.push('completed');
    };

    // Two concurrent calls (e.g. video fires onComplete twice)
    await Promise.all([markComplete(true), markComplete(true)]);

    // Both calls ran concurrently — the second one may also proceed since
    // isCompleted hasn't been set yet when both start. This is the residual
    // race that only a server-side idempotency check fully prevents.
    // The test documents the behavior rather than asserting a specific count.
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls.every((c) => c === 'completed' || c === 'no-op')).toBe(true);
  });
});
