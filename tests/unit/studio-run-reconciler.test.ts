import { describe, expect, it } from 'vitest';
import { deriveStudioRunState, evaluateCompletedStudioTask } from '@/lib/devstudio/studio-run-reconciler';

describe('canonical Studio run reconciliation', () => {
  it('does not verify a completed health task whose actual tool payload failed', () => {
    const result = evaluateCompletedStudioTask({ id: 'health', status: 'completed', tool_name: 'devstudio.health', result_json: { ok: true }, tool_output: { ok: false, message: 'Owned AI is unavailable' } });
    expect(result.status).toBe('FAIL_BLOCKING');
    expect(result.reasons).toContain('Owned AI is unavailable');
  });
  it('does not mistake an outer execution acknowledgment for successful tool evidence', () => {
    expect(evaluateCompletedStudioTask({ id: 'health', status: 'completed', tool_name: 'devstudio.health', result_json: { ok: true, payload: { ok: false } } }).status).toBe('FAIL_BLOCKING');
  });
  it('verifies a successful tool result', () => {
    expect(evaluateCompletedStudioTask({ id: 'health', status: 'completed', tool_name: 'devstudio.health', tool_output: { ok: true, checks: [] } }).status).toBe('PASS');
  });
  it('does not report completion while a required step is still active', () => {
    expect(
      deriveStudioRunState([
        { status: 'verified', required: true },
        { status: 'running', required: true },
      ]),
    ).toEqual({ status: 'executing', failure: null });
  });

  it('projects approval waits as a blocked run', () => {
    expect(
      deriveStudioRunState([
        { status: 'blocked', required: true },
        { status: 'pending', required: true },
      ]),
    ).toEqual({ status: 'blocked', failure: null });
  });

  it('requires every required step to be verified or intentionally skipped', () => {
    expect(
      deriveStudioRunState([
        { status: 'verified', required: true },
        { status: 'skipped', required: true },
        { status: 'failed', required: false },
      ]),
    ).toEqual({ status: 'completed', failure: null });
  });

  it('makes a required failure authoritative', () => {
    const failure = { message: 'Repository verification failed' };
    expect(
      deriveStudioRunState([
        { status: 'verified', required: true },
        { status: 'failed', required: true, error: failure },
      ]),
    ).toEqual({ status: 'failed', failure });
  });
});

