import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  user: { id: 'current-learner' } as { id: string } | null,
  active: true,
  status: '',
  readError: false,
  writeError: false,
  writes: [] as any[],
  filters: [] as any[],
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      let write = false;
      const chain: any = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          state.filters.push([key, value]);
          return chain;
        },
        not: () => chain,
        maybeSingle: async () => ({
          data:
            table === 'scorm_packages'
              ? state.active
                ? { id: 'package' }
                : null
              : { status: state.status },
          error: state.readError ? { message: 'unavailable' } : null,
        }),
        upsert: async (value: unknown) => {
          state.writes.push(value);
          return { error: state.writeError ? { message: 'unavailable' } : null };
        },
        update: (value: unknown) => {
          state.writes.push(value);
          write = true;
          return chain;
        },
        then: (resolve: any) =>
          resolve({ error: write && state.writeError ? { message: 'unavailable' } : null }),
      };
      return chain;
    },
  }),
}));
import { POST } from '../../apps/lms/app/api/learner/job-ready/[slug]/route';
const request = (body: unknown, origin = 'https://app.example.test') =>
  new NextRequest('https://app.example.test/api/learner/job-ready/mindsets', {
    method: 'POST',
    headers: { origin },
    body: JSON.stringify(body),
  });
const context = { params: Promise.resolve({ slug: 'mindsets' }) };
beforeEach(() => {
  state.user = { id: 'current-learner' };
  state.active = true;
  state.status = '';
  state.readError = false;
  state.writeError = false;
  state.writes = [];
  state.filters = [];
});
it('requires authentication and rejects cross-origin writes', async () => {
  expect((await POST(request({ cmi: {} }, 'https://attacker.test'), context)).status).toBe(403);
  state.user = null;
  expect((await POST(request({ cmi: {} }), context)).status).toBe(401);
  expect(state.writes).toHaveLength(0);
});
it('ignores forged identity and never updates a technical enrollment or credential', async () => {
  const result = await POST(
    request({ user_id: 'another-learner', cmi: { 'cmi.completion_status': 'completed' } }),
    context,
  );
  expect(result.status).toBe(200);
  expect(state.writes[0]).toMatchObject({ user_id: 'current-learner' });
  expect(state.filters).toContainEqual(['user_id', 'current-learner']);
  expect(state.writes[1]).toMatchObject({ status: 'completed', progress_percentage: 100 });
});
it('preserves completed records during review', async () => {
  state.status = 'completed';
  expect(
    (await POST(request({ cmi: { 'cmi.completion_status': 'incomplete' } }), context)).status,
  ).toBe(200);
  expect(state.writes).toHaveLength(0);
});
it('fails explicitly for inactive packages, malformed data, and save failures', async () => {
  expect((await POST(request({ cmi: { 'not-cmi': 'x' } }), context)).status).toBe(400);
  expect((await POST(request({ cmi: [] }), context)).status).toBe(400);
  state.active = false;
  expect((await POST(request({ cmi: {} }), context)).status).toBe(503);
  state.active = true;
  state.writeError = true;
  expect((await POST(request({ cmi: {} }), context)).status).toBe(503);
});

it('accepts the canonical LMS browser origin behind an internal Cloud Run URL', async () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.elevateforhumanity.org');
  try {
    const forwarded = new NextRequest(
      'http://internal-service:8080/api/learner/job-ready/mindsets',
      {
        method: 'POST',
        headers: { origin: 'https://app.elevateforhumanity.org' },
        body: JSON.stringify({ cmi: { 'cmi.location': 'resume-here' } }),
      },
    );
    expect((await POST(forwarded, context)).status).toBe(200);
    expect(state.writes[1].cmi_data['cmi.location']).toBe('resume-here');
  } finally {
    vi.unstubAllEnvs();
  }
});
