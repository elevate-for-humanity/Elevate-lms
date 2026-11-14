/**
 * Unit tests for the pure helper functions in lib/lms/engine/gate.ts:
 *   - isCheckpointGateError
 *   - checkpointGateResponse
 *
 * gate.ts has `import 'server-only'' and also imports requireAdminClient,
 * so we cannot import the file directly even with the server-only shim
 * (requireAdminClient would pull in the full Supabase admin chain).
 * Both helpers are pure and have no DB calls, so we inline-extract them
 * here, mirroring the source exactly.
 *
 * Source: lib/lms/engine/gate.ts — isCheckpointGateError(), checkpointGateResponse()
 * Keep this in sync if the source changes.
 */

import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';

// ─── Inline-extracted types (mirrors source) ──────────────────────────────────

interface CheckpointGateError {
  code: 'CHECKPOINT_NOT_PASSED';
  message: string;
  checkpointLessonId: string;
  checkpointTitle: string;
  requiredScore: number;
  bestScore: number | null;
}

// ─── Inline-extracted functions (mirrors source exactly) ──────────────────────

function isCheckpointGateError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    (err as CheckpointGateError).code === 'CHECKPOINT_NOT_PASSED' ||
    msg.includes('Checkpoint gate blocked') ||
    msg.includes('23514')
  );
}

function checkpointGateResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'You must pass the required checkpoint before continuing.',
      code: 'CHECKPOINT_NOT_PASSED',
    },
    { status: 403 },
  );
}

// ─── isCheckpointGateError ────────────────────────────────────────────────────

describe('isCheckpointGateError', () => {
  it('returns false for null', () => {
    expect(isCheckpointGateError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isCheckpointGateError(undefined)).toBe(false);
  });

  it('returns false for false', () => {
    expect(isCheckpointGateError(false)).toBe(false);
  });

  it('returns false for a plain Error with an unrelated message', () => {
    expect(isCheckpointGateError(new Error('something went wrong'))).toBe(false);
  });

  it('returns false for an empty Error', () => {
    expect(isCheckpointGateError(new Error(''))).toBe(false);
  });

  it('returns true for an object with code CHECKPOINT_NOT_PASSED', () => {
    const gateErr: CheckpointGateError = {
      code: 'CHECKPOINT_NOT_PASSED',
      message: 'You must pass the checkpoint.',
      checkpointLessonId: 'cp-1',
      checkpointTitle: 'Module 1 Checkpoint',
      requiredScore: 70,
      bestScore: null,
    };
    expect(isCheckpointGateError(gateErr)).toBe(true);
  });

  it('returns true for an object with code CHECKPOINT_NOT_PASSED and a bestScore', () => {
    const gateErr: CheckpointGateError = {
      code: 'CHECKPOINT_NOT_PASSED',
      message: 'You must pass the checkpoint.',
      checkpointLessonId: 'cp-2',
      checkpointTitle: 'Module 2 Checkpoint',
      requiredScore: 80,
      bestScore: 65,
    };
    expect(isCheckpointGateError(gateErr)).toBe(true);
  });

  it('returns true for an Error whose message includes "Checkpoint gate blocked"', () => {
    expect(isCheckpointGateError(new Error('Checkpoint gate blocked: module 2'))).toBe(true);
  });

  it('returns true for an Error whose message includes "23514" (Postgres check constraint)', () => {
    expect(isCheckpointGateError(new Error('ERROR: 23514 check constraint violation'))).toBe(true);
  });

  it('returns true for a plain string containing "23514"', () => {
    // String(err) path — err is not an Error instance
    expect(isCheckpointGateError('23514')).toBe(true);
  });

  it('returns true for a plain string containing "Checkpoint gate blocked"', () => {
    expect(isCheckpointGateError('Checkpoint gate blocked')).toBe(true);
  });

  it('returns false for a plain string with unrelated content', () => {
    expect(isCheckpointGateError('network timeout')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isCheckpointGateError(42)).toBe(false);
  });

  it('returns false for an object without the code field', () => {
    expect(isCheckpointGateError({ message: 'some error' })).toBe(false);
  });

  it('returns false for an object with a different code value', () => {
    expect(isCheckpointGateError({ code: 'SOME_OTHER_ERROR', message: 'nope' })).toBe(false);
  });
});

// ─── checkpointGateResponse ───────────────────────────────────────────────────

describe('checkpointGateResponse', () => {
  it('returns a NextResponse', () => {
    const res = checkpointGateResponse();
    expect(res).toBeInstanceOf(NextResponse);
  });

  it('has status 403', () => {
    const res = checkpointGateResponse();
    expect(res.status).toBe(403);
  });

  it('body contains code CHECKPOINT_NOT_PASSED', async () => {
    const res = checkpointGateResponse();
    const body = await res.json();
    expect(body.code).toBe('CHECKPOINT_NOT_PASSED');
  });

  it('body contains an error message string', async () => {
    const res = checkpointGateResponse();
    const body = await res.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('is deterministic — two calls return the same shape', async () => {
    const res1 = checkpointGateResponse();
    const res2 = checkpointGateResponse();
    const [b1, b2] = await Promise.all([res1.json(), res2.json()]);
    expect(b1).toEqual(b2);
    expect(res1.status).toBe(res2.status);
  });
});
