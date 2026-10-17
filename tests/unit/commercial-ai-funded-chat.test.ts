import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const state = vi.hoisted(() => ({
  denied: false,
  builderStatus: 'active',
  generate: vi.fn(),
  reserve: vi.fn(),
  trial: vi.fn(),
}));
vi.mock('@/lib/ai/execute-ai-task', () => ({ executeAiTask: state.generate }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/platform/require-feature-for-auth', () => ({
  requireFeatureForAuth: async () =>
    state.denied
      ? NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
      : { userId: 'buyer', tenantId: 'verified-tenant' },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'buyer' } } }) },
  }),
}));
vi.mock('@/lib/apps/website-builder-access', () => ({
  getWebsiteBuilderAccess: async () => ({ allowed: true, status: state.builderStatus }),
}));
vi.mock('@/lib/apps/website-builder-trial', () => ({ consumeWebsiteBuilderCredits: state.trial }));
vi.mock('@/lib/platform/commercial-ai-credits', () => ({
  reserveCommercialAiReply: state.reserve,
  CommercialAiCreditsError: class extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code: string,
    ) {
      super(message);
    }
  },
}));
import { CommercialAiCreditsError } from '@/lib/platform/commercial-ai-credits';
import { handleCommercialAgentChat } from '@/lib/platform/handle-commercial-agent-chat';
const request = (extra = {}) =>
  new NextRequest('https://example.test/api/platform/agent-chat', {
    method: 'POST',
    headers: { 'idempotency-key': 'request-1' },
    body: JSON.stringify({ agent: 'paris', message: 'Help qualify a lead', ...extra }),
  });
beforeEach(() => {
  state.denied = false;
  state.builderStatus = 'active';
  state.generate
    .mockReset()
    .mockResolvedValue({ content: 'A useful reply', provider: 'configured', tokensUsed: 100 });
  state.reserve.mockReset().mockResolvedValue({ charged: 10, balance: 240 });
  state.trial
    .mockReset()
    .mockResolvedValue({ allowed: true, isTrial: false, charged: 12, balance: 488 });
});
describe('commercial assistant paid usage boundary', () => {
  it('rejects inherited property names as assistant identifiers', async () => {
    expect((await handleCommercialAgentChat(request({ agent: 'toString' }))).status).toBe(400);
    expect(state.reserve).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('rejects a null JSON body before access checks or usage', async () => {
    const input = new NextRequest('https://example.test/api/platform/agent-chat', {
      method: 'POST',
      body: 'null',
    });
    expect((await handleCommercialAgentChat(input)).status).toBe(400);
    expect(state.reserve).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('reserves funded usage before dispatch, using the authenticated tenant', async () => {
    const response = await handleCommercialAgentChat(request({ tenantId: 'forged' }));
    expect(response.status).toBe(200);
    expect(state.reserve).toHaveBeenCalledWith({
      tenantId: 'verified-tenant',
      userId: 'buyer',
      agent: 'paris',
      idempotencyKey: 'request-1',
    });
    expect(state.reserve.mock.invocationCallOrder[0]).toBeLessThan(
      state.generate.mock.invocationCallOrder[0],
    );
    expect(await response.json()).toMatchObject({ creditsCharged: 10, creditsRemaining: 240 });
  });
  it('does not spend Website Builder credits for a denied paid-account request', async () => {
    state.denied = true;
    expect((await handleCommercialAgentChat(request())).status).toBe(403);
    expect(state.trial).not.toHaveBeenCalled();
    expect(state.reserve).not.toHaveBeenCalled();
    expect(state.generate).not.toHaveBeenCalled();
  });
  for (const [status, code] of [
    [402, 'INSUFFICIENT_CREDITS'],
    [409, 'DUPLICATE_REQUEST'],
    [503, 'USAGE_UNAVAILABLE'],
  ] as const)
    it(`blocks provider execution on ${code}`, async () => {
      state.reserve.mockRejectedValue(new CommercialAiCreditsError('Usage blocked', status, code));
      expect((await handleCommercialAgentChat(request())).status).toBe(status);
      expect(state.generate).not.toHaveBeenCalled();
    });
  it('preserves the separately limited Website Builder trial preview', async () => {
    state.denied = true;
    state.builderStatus = 'trial';
    state.trial.mockResolvedValue({ allowed: true, isTrial: true, charged: 12, balance: 488 });
    expect((await handleCommercialAgentChat(request())).status).toBe(200);
    expect(state.reserve).not.toHaveBeenCalled();
    expect(state.trial).toHaveBeenCalledOnce();
  });
  it('bounds context and output independently of client-supplied limits', async () => {
    await handleCommercialAgentChat(
      request({
        message: 'x'.repeat(12000),
        history: Array.from({ length: 40 }, () => ({ role: 'user', content: 'y'.repeat(6000) })),
        organizationContext: 'z'.repeat(16000),
        maxTokens: 999999,
      }),
    );
    const input = state.generate.mock.calls[0][0];
    expect(input.maxTokens).toBe(1000);
    expect(input.context.history).toHaveLength(8);
    expect(input.context.skipRAG).toBe(true);
    expect(input.context.history.every((m: any) => m.content.length === 1500)).toBe(true);
    expect(input.prompt.length).toBeLessThan(9000);
  });
});
