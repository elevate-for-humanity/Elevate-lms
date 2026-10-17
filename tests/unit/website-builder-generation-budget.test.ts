import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ consume: vi.fn(), generate: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'buyer', email: 'buyer@example.test' } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
    }),
  }),
}));
vi.mock('@/lib/ai/orchestrator', () => ({ runAITask: state.generate }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/apps/website-builder-trial', () => ({
  consumeWebsiteBuilderCredits: state.consume,
}));
vi.mock('@/lib/apps/website-builder-access', () => ({
  getWebsiteBuilderAccess: async () => ({
    allowed: true,
    isAdmin: false,
    plan: 'starter',
    status: 'active',
  }),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_path: string, handler: unknown) => handler,
}));
vi.mock('@/lib/tenant/default-site-config', () => ({
  buildDefaultSiteConfig: () => ({ template: { id: 'test' } }),
}));
vi.mock('@/lib/website-builder/interview', () => ({ missingRequiredWebsiteAnswers: () => [] }));
import { POST } from '@/apps/marketing/app/api/apps/website-builder/ai-generate/route';
const request = () =>
  new NextRequest('https://example.test/api/apps/website-builder/ai-generate', {
    method: 'POST',
    body: JSON.stringify({
      businessName: 'Example shop',
      brief:
        'An independently owned neighborhood shop offering local customers haircuts and grooming.',
    }),
  });
beforeEach(() => {
  state.consume.mockReset();
  state.generate.mockReset();
});
describe('Website Builder provider spend ordering', () => {
  it('does not call an AI provider when credits are exhausted', async () => {
    state.consume.mockResolvedValue({
      allowed: false,
      balance: 0,
      charged: 0,
      error: 'Allowance exhausted',
    });
    expect((await POST(request())).status).toBe(402);
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('reserves credits before dispatching an expensive generation', async () => {
    state.consume.mockResolvedValue({ allowed: true, balance: 440, charged: 60 });
    state.generate.mockRejectedValue(new Error('provider unavailable'));
    expect((await POST(request())).status).toBe(502);
    expect(state.consume.mock.invocationCallOrder[0]).toBeLessThan(
      state.generate.mock.invocationCallOrder[0],
    );
  });
});
