// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ existing: false, partner: false, insert: vi.fn(), update: vi.fn(), provision: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: mocks.send }));
vi.mock('@/lib/partners/provision-host-shop-draft', () => ({ provisionHostShopDraft: mocks.provision }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  const chain = { select: () => chain, eq: () => chain, ilike: () => chain, not: () => chain, order: () => chain, limit: () => chain,
    maybeSingle: async () => ({ data: (table === 'partners' ? mocks.partner : mocks.existing) ? { id: 'saved-record' } : null, error: null }),
    insert: mocks.insert, update: mocks.update };
  return chain;
} }) }));
import { POST } from '@/apps/marketing/app/api/host-shop/draft/route';
beforeEach(() => { vi.clearAllMocks(); mocks.existing = false; mocks.partner = false; });
function request() { return new Request('https://www.elevateforhumanity.org/api/host-shop/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ legalBusinessName: 'Fixture Salon', ownerName: 'Fixture Owner', email: 'fixture@example.com', phone: '3175550100', address1: '100 Main St', city: 'Indianapolis', state: 'Indiana', zip: '46222', programs: ['cosmetology'] }) }); }
it.each(['existing', 'partner'] as const)('directs a returning %s to authenticated onboarding without overwriting approval or documents', async (key) => {
  mocks[key] = true;
  const response = await POST(request());
  expect(response.status).toBe(409);
  expect((await response.json()).error).toContain('Sign in to finish');
  expect(mocks.insert).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.provision).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
});
