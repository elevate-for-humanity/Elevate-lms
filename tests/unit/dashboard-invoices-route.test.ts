import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../apps/lms/app/api/billing/invoices/route';

const { getUser, requireAdminClient, listApprenticeInvoices } = vi.hoisted(() => ({
  getUser: vi.fn(),
  requireAdminClient: vi.fn(),
  listApprenticeInvoices: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient }));
vi.mock('@/lib/billing/apprentice-invoice-batch', () => ({ listApprenticeInvoices }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

describe('dashboard invoices endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects anonymous requests before reading billing records', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await GET()).status).toBe(401);
    expect(requireAdminClient).not.toHaveBeenCalled();
  });

  it('uses the authenticated owner and returns a private invoice response', async () => {
    getUser.mockResolvedValue({ data: { user: {
      id: 'learner', email: 'learner@example.test', email_confirmed_at: '2026-11-20',
    } } });
    requireAdminClient.mockResolvedValue('billing-db');
    const invoices = [{ id: 'invoice', descriptions: ['Barber Apprenticeship – Week 4'] }];
    listApprenticeInvoices.mockResolvedValue(invoices);
    const result = await GET();
    expect(result.status).toBe(200);
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
    expect(listApprenticeInvoices).toHaveBeenCalledWith('billing-db', 'learner', 10, 'learner@example.test');
    expect(await result.json()).toEqual({ invoices });
  });

  it('does not use an unconfirmed address and reports a billing outage', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'learner', email: 'unverified@example.test' } } });
    requireAdminClient.mockResolvedValue('billing-db');
    listApprenticeInvoices.mockRejectedValue(new Error('Database unavailable'));
    const result = await GET();
    expect(listApprenticeInvoices).toHaveBeenCalledWith('billing-db', 'learner', 10, null);
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ error: 'Could not load invoices' });
  });
});
