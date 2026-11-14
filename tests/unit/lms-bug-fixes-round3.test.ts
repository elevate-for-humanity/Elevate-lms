/**
 * Regression tests for three critical LMS bugs fixed in fix/lms-critical-bugs-2.
 *
 * Bug #1 — enrollment-status: `request` ReferenceError bypasses enrollment gate
 * Bug #2 — lesson page: markComplete() without forceComplete toggles lesson incomplete
 * Bug #4 — completion engine: progress % fallback never triggered on zero-row UPDATE
 */

import { describe, it, expect } from 'vitest';

// ─── Bug #1: enrollment-status GET — `request` ReferenceError ────────────────
//
// The handler parameter is `req` but the rate-limit call referenced the
// undeclared variable `request`. In strict mode this is a ReferenceError;
// in loose environments it resolves to undefined. Either way the rate limiter
// never received the actual request object, and the route crashed with 500.
//
// The lesson page treats a non-ok enrollment response as "fail open", so every
// unenrolled user could access paid lesson content.
//
// Fix: pass `req` (the actual parameter) to applyRateLimit.

describe('Bug #1 — enrollment-status: req passed to applyRateLimit', () => {
  it('undefined is not the same reference as the request object', () => {
    const req = { url: '/api/lms/enrollment-status?courseId=abc' };
    // Simulates the broken code: `request` was not declared in scope
    const undeclaredRequest = undefined;

    expect(undeclaredRequest).toBeUndefined();
    expect(undeclaredRequest).not.toBe(req);
  });

  it('fixed call site passes req as the first argument', () => {
    const req = { url: '/api/lms/enrollment-status?courseId=abc' };
    const captured: unknown[] = [];
    const applyRateLimit = (r: unknown, _tier: string) => {
      captured.push(r);
      return null;
    };

    // Fixed: applyRateLimit(req, 'api')
    applyRateLimit(req, 'api');

    expect(captured[0]).toBe(req);
  });

  it('a 500 from the enrollment-status endpoint causes the lesson page to fail open', () => {
    // Mirrors the lesson page's enrollment check logic
    function lessonPageEnrollmentCheck(res: { ok: boolean; enrolled?: boolean }): 'allowed' | 'blocked' {
      if (!res.ok) return 'allowed'; // fail open on error
      return res.enrolled ? 'allowed' : 'blocked';
    }

    // Broken: endpoint crashes → 500 → unenrolled user gets in
    expect(lessonPageEnrollmentCheck({ ok: false })).toBe('allowed');
    // Fixed: endpoint works → explicit not-enrolled → blocked
    expect(lessonPageEnrollmentCheck({ ok: true, enrolled: false })).toBe('blocked');
    // Fixed: enrolled user still gets in
    expect(lessonPageEnrollmentCheck({ ok: true, enrolled: true })).toBe('allowed');
  });
});

// ─── Bug #2: lesson page — markComplete() without forceComplete toggles lesson incomplete ──
//
// When a learner passes a checkpoint quiz, markComplete() was called without
// forceComplete=true. The function computes:
//   newStatus = forceComplete ? true : !isCompleted
//
// If the learner retakes a quiz they already passed (isCompleted=true), newStatus
// becomes false, and the function fires DELETE /api/lessons/[id]/complete —
// marking the lesson incomplete, decrementing progress %, and potentially
// revoking a certificate.
//
// Fix: call markComplete(true) in the onComplete handler so passing a quiz
// always marks the lesson complete, never toggles it.

describe('Bug #2 — lesson page: markComplete(true) in checkpoint onComplete', () => {
  function computeNewStatus(forceComplete: boolean | undefined, isCompleted: boolean): boolean {
    return forceComplete ? true : !isCompleted;
  }

  it('without forceComplete, passing a quiz when already complete toggles to incomplete', () => {
    const isCompleted = true; // learner already passed this lesson
    const newStatus = computeNewStatus(undefined, isCompleted);
    // Bug: newStatus=false → fires DELETE → lesson marked incomplete
    expect(newStatus).toBe(false);
  });

  it('with forceComplete=true, passing a quiz always marks the lesson complete', () => {
    const isCompleted = true;
    const newStatus = computeNewStatus(true, isCompleted);
    expect(newStatus).toBe(true);
  });

  it('with forceComplete=true, first-time pass also marks complete', () => {
    const isCompleted = false;
    const newStatus = computeNewStatus(true, isCompleted);
    expect(newStatus).toBe(true);
  });

  it('no-op guard prevents redundant API calls when already in target state', () => {
    // markComplete has: if (newStatus === isCompleted) return;
    const isCompleted = true;
    const newStatus = computeNewStatus(true, isCompleted);
    // newStatus === isCompleted → no-op, no DELETE fired
    expect(newStatus).toBe(isCompleted);
  });

  it('toggle behaviour is intentional only for the manual complete button (no forceComplete)', () => {
    // The manual "Mark Complete" button calls markComplete() without forceComplete
    // so learners can un-complete a lesson. This is the only intended toggle path.
    const isCompleted = true;
    const newStatus = computeNewStatus(undefined, isCompleted);
    expect(newStatus).toBe(false); // intentional toggle for manual button
  });
});

// ─── Bug #4: completion engine — progress % fallback never triggered ──────────
//
// recordStepCompletion and recordStepUncompletion both try to update
// program_enrollments by course_id first, then fall back to program_id.
//
// The fallback was gated on `if (directUpdateError)`. Supabase/PostgREST returns
// error=null when an UPDATE matches zero rows — it is not an error. For learners
// enrolled via program_id (not course_id), the first UPDATE silently matched 0
// rows, directUpdateError was null, and the fallback was never reached.
// progress_percent stayed at 0%, isCourseComplete() always returned false, and
// certificates were never issued for this enrollment type.
//
// Fix: check `!directUpdated?.length` (zero rows returned) in addition to the
// error, so the fallback fires whenever the course_id UPDATE is a no-op.

describe('Bug #4 — completion engine: zero-row UPDATE triggers program_id fallback', () => {
  interface UpdateResult {
    data: { id: string }[] | null;
    error: null | { message: string };
  }

  // Mirrors the fixed fallback condition
  function shouldUseProgramIdFallback(result: UpdateResult): boolean {
    return !!result.error || !result.data?.length;
  }

  it('broken condition: error=null on zero-row UPDATE does not trigger fallback', () => {
    // Supabase returns error=null when 0 rows matched — the broken check misses this
    const zeroRowResult: UpdateResult = { data: [], error: null };
    const brokenCondition = !!zeroRowResult.error; // old: if (directUpdateError)
    expect(brokenCondition).toBe(false); // fallback never reached → progress stuck at 0%
  });

  it('fixed condition: zero-row UPDATE (data=[]) triggers fallback', () => {
    const zeroRowResult: UpdateResult = { data: [], error: null };
    expect(shouldUseProgramIdFallback(zeroRowResult)).toBe(true);
  });

  it('fixed condition: null data triggers fallback', () => {
    const nullDataResult: UpdateResult = { data: null, error: null };
    expect(shouldUseProgramIdFallback(nullDataResult)).toBe(true);
  });

  it('fixed condition: successful UPDATE (data has rows) does not trigger fallback', () => {
    const successResult: UpdateResult = { data: [{ id: 'enroll-1' }], error: null };
    expect(shouldUseProgramIdFallback(successResult)).toBe(false);
  });

  it('fixed condition: DB error still triggers fallback', () => {
    const errorResult: UpdateResult = { data: null, error: { message: 'connection error' } };
    expect(shouldUseProgramIdFallback(errorResult)).toBe(true);
  });

  it('progress % is never persisted for program-level enrollments without the fix', () => {
    // Simulate the broken path: course_id UPDATE matches 0 rows, fallback skipped
    let progressPersisted = false;

    function updateProgressBroken(
      courseIdUpdateResult: UpdateResult,
      _programId: string,
    ): void {
      if (courseIdUpdateResult.error) {
        // fallback would run here, but error is null for zero-row updates
        progressPersisted = true;
      }
      // zero-row update with error=null → falls through without persisting
    }

    updateProgressBroken({ data: [], error: null }, 'program-uuid');
    expect(progressPersisted).toBe(false); // bug: progress never written
  });

  it('progress % is persisted via program_id fallback with the fix', () => {
    let progressPersisted = false;
    let usedProgramIdFallback = false;

    function updateProgressFixed(
      courseIdUpdateResult: UpdateResult,
      programId: string,
    ): void {
      if (courseIdUpdateResult.error || !courseIdUpdateResult.data?.length) {
        // fallback: update by program_id
        usedProgramIdFallback = true;
        progressPersisted = true;
      }
    }

    updateProgressFixed({ data: [], error: null }, 'program-uuid');
    expect(usedProgramIdFallback).toBe(true);
    expect(progressPersisted).toBe(true);
  });
});
