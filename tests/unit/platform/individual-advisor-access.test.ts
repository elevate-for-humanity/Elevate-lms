import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const state = vi.hoisted(() => ({ denied: false, requests: [] as any[], empty: false }));
vi.mock('@/lib/apps/workspaces/access', () => ({
  requireIndividualWorkspace: async () =>
    state.denied
      ? NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
      : { userId: 'buyer' },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/ai/ai-service', () => ({
  aiChat: async (options: any) => {
    state.requests.push(options);
    return { content: state.empty ? '' : 'Fixture advisor response', model: 'owned-runtime' };
  },
}));
import { POST } from '@/apps/marketing/app/api/apps/context-advisor/route';
function request(body: any) {
  return new NextRequest('https://example.test/api/apps/context-advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  state.denied = false;
  state.requests = [];
  state.empty = false;
});
describe('Subscribed workspace advisors share platform access and inference', () => {
  it('does not run AI after subscription access is denied', async () => {
    state.denied = true;
    expect((await POST(request({ appSlug: 'grants', question: 'Help me plan' }))).status).toBe(403);
    expect(state.requests).toEqual([]);
  });
  it.each(['grants', 'sam-gov'])('uses the canonical owned runtime for %s', async (appSlug) => {
    const response = await POST(
      request({
        appSlug,
        question: 'Help me organize my records',
        context: { purpose: 'Fixture context' },
      }),
    );
    expect(response.status).toBe(200);
    expect(state.requests[0]).toMatchObject({ providerPolicy: 'owned-only', maxTokens: 900 });
    expect(state.requests[0]).not.toHaveProperty('model');
    expect(await response.json()).toMatchObject({ answer: 'Fixture advisor response' });
  });
  it('does not present an empty model response as success', async () => {
    state.empty = true;
    expect((await POST(request({ appSlug: 'grants', question: 'Help me plan' }))).status).toBe(502);
  });
  it('validates the request shape before using it', async () => {
    expect((await POST(request(null))).status).toBe(400);
    expect(state.requests).toEqual([]);
  });
});
