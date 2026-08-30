import { describe, expect, it, vi } from 'vitest';

import {
  createQaAuthUser,
  formatSupabaseAuthError,
  isRetryableSupabaseAuthError,
} from '../../scripts/qa/supabase-auth-fixtures.mjs';

describe('QA Supabase Auth fixtures', () => {
  it('preserves structured Supabase diagnostics', () => {
    expect(formatSupabaseAuthError({ message: '{}', status: 503, code: 'unexpected_failure' }))
      .toBe('{} status=503 code=unexpected_failure');
  });

  it('retries rate limits, outages, and network failures but not validation errors', () => {
    expect(isRetryableSupabaseAuthError({ status: 429, message: 'rate limited' })).toBe(true);
    expect(isRetryableSupabaseAuthError({ status: 503, message: '{}' })).toBe(true);
    expect(isRetryableSupabaseAuthError(new Error('fetch failed: socket hang up'))).toBe(true);
    expect(isRetryableSupabaseAuthError({ status: 422, message: 'invalid email' })).toBe(false);
  });

  it('adopts a timed-out create on the next bounded attempt', async () => {
    const createdUser = {
      id: 'qa-user-id',
      email: 'qa-e2e-1-host@qa.invalid',
      app_metadata: { qa_e2e: true, qa_run_id: '1' },
      user_metadata: {},
    };
    let listAttempt = 0;
    const db = {
      auth: {
        admin: {
          listUsers: vi.fn(async () => ({
            data: { users: listAttempt++ === 0 ? [] : [createdUser] },
            error: null,
          })),
          createUser: vi.fn(async () => ({ data: { user: null }, error: { status: 503, message: '{}' } })),
          updateUserById: vi.fn(async () => ({ data: { user: createdUser }, error: null })),
        },
      },
    };

    const user = await createQaAuthUser({
      db,
      email: createdUser.email,
      password: 'Qa!safe-password7z',
      role: 'host_shop',
      fullName: 'QA Host',
      runId: '1',
      label: 'create host auth user',
      baseDelayMs: 1,
      sleepFn: async () => {},
    });

    expect(user.id).toBe('qa-user-id');
    expect(db.auth.admin.createUser).toHaveBeenCalledTimes(1);
    expect(db.auth.admin.updateUserById).toHaveBeenCalledTimes(1);
  });

  it('fails closed instead of reusing a non-QA identity', async () => {
    const db = {
      auth: {
        admin: {
          listUsers: vi.fn(async () => ({
            data: { users: [{ id: 'real-user', email: 'collision@example.com', app_metadata: {} }] },
            error: null,
          })),
          createUser: vi.fn(),
          updateUserById: vi.fn(),
        },
      },
    };

    await expect(createQaAuthUser({
      db,
      email: 'collision@example.com',
      password: 'Qa!safe-password7z',
      role: 'host_shop',
      fullName: 'QA Host',
      runId: '1',
      label: 'create host auth user',
      sleepFn: async () => {},
    })).rejects.toThrow('Refusing to reuse non-QA Auth identity');
  });
});
