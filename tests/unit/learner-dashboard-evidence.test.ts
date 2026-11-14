import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { loadEarnedCredentials, loadRecentQuizAttempts } from '@/lib/learner/dashboard-evidence';

const learner = '4d765a86-5e69-4508-a522-08ae6a6bf080';
function database(titleFailure = false, attemptsFailure = false) {
  const requests: URL[] = [];
  const db = createClient('https://fixture.supabase.co', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input)); requests.push(url);
      const table = url.pathname.split('/').pop();
      const select = url.searchParams.get('select') ?? '';
      let status = 200;
      let data: unknown = [];
      if (table === 'learner_credentials') {
        if (select.includes('credentials:credential_registry(name)'))
          data = [{ id: 'award', credentials: { name: 'EPA 608' } }];
        else { status = 400; data = { code: 'PGRST200', message: 'No relationship to credentials' }; }
      } else if (table === 'quiz_attempts') {
        if (select.includes('quizzes(') || attemptsFailure) {
          status = 400; data = { code: 'PGRST200', message: 'No relationship to quizzes' };
        } else data = [
          { id: 3, quiz_id: 10, score: 90, passed: true },
          { id: 2, quiz_id: 10, score: 70, passed: false },
          { id: 1, quiz_id: 999, score: 80, passed: true },
        ];
      } else if (table === 'quizzes') {
        if (titleFailure) { status = 403; data = { code: '42501', message: 'Not permitted' }; }
        else data = [{ id: 10, title: 'Electrical safety' }];
      } else throw new Error('Unexpected table');
      return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
    } },
  });
  return { db, requests };
}

describe('learner dashboard evidence against the production relationship shape', () => {
  it('reads the real credential FK and limits awards to the selected active learner', async () => {
    const { db, requests } = database();
    const result = await loadEarnedCredentials(db, learner);
    expect(result.error).toBeNull();
    expect(result.data?.[0].credentials).toEqual({ name: 'EPA 608' });
    expect(requests[0].searchParams.get('learner_id')).toBe(`eq.${learner}`);
    expect(requests[0].searchParams.get('status')).toBe('eq.active');
  });

  it('resolves titles without an absent FK and preserves order, repeated attempts and deleted quizzes', async () => {
    const { db, requests } = database();
    const result = await loadRecentQuizAttempts(db, learner);
    expect(result.error).toBeNull();
    expect(result.data?.map(row => row.id)).toEqual([3, 2, 1]);
    expect(result.data?.map(row => row.quizzes?.title ?? null)).toEqual(['Electrical safety', 'Electrical safety', null]);
    expect(requests[0].searchParams.get('user_uuid')).toBe(`eq.${learner}`);
    expect(requests[0].searchParams.get('limit')).toBe('5');
    expect(requests[0].searchParams.get('completed_at')).toBe('not.is.null');
    expect(requests[1].searchParams.get('id')).toBe('in.(10,999)');
  });

  it('retains actual scores when quiz-title access fails and exposes the read error', async () => {
    const { db } = database(true);
    const result = await loadRecentQuizAttempts(db, learner);
    expect(result.data?.map(row => row.score)).toEqual([90, 70, 80]);
    expect(result.error?.code).toBe('42501');
  });

  it('does not turn an attempt query failure into an empty successful history', async () => {
    const { db, requests } = database(false, true);
    const result = await loadRecentQuizAttempts(db, learner);
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('PGRST200');
    expect(requests).toHaveLength(1);
  });
});
