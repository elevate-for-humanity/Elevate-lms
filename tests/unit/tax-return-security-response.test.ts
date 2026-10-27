// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ user: { id: 'owner-id' } as { id: string } | null, error: null as { code: string; message: string } | null, insert: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: () => ({ insert: (value: unknown) => { state.insert(value); return { select: () => ({ single: async () => ({ data: state.error ? null : { id: 'return-id' }, error: state.error }) }) }; } }),
}) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
import { POST } from '@/apps/marketing/app/api/tax/returns/route';

const request = () => new NextRequest('https://www.elevateforhumanity.org/api/tax/returns', { method: 'POST', body: JSON.stringify({ taxYear: 2026, filingStatus: 'single' }), headers: { 'content-type': 'application/json' } });
beforeEach(() => { state.user = { id: 'owner-id' }; state.error = null; state.insert.mockClear(); });
describe('tax return start security', () => {
  it('returns an actionable verification response without bypassing the database denial', async () => {
    state.error = { code: '42501', message: 'new row violates row-level security policy "require_privileged_aal2" for table "tax_returns"' };
    const result = await POST(request());
    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({ code: 'MFA_REQUIRED' });
  });
  it('creates a return owned by the authenticated user after the database accepts it', async () => {
    const result = await POST(request());
    expect(result.status).toBe(201);
    expect(await result.json()).toMatchObject({ returnId: 'return-id' });
    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ created_by_user_id: 'owner-id', service_type: 'self_file' }));
  });
  it('requires sign-in and never attempts an anonymous insert', async () => {
    state.user = null;
    expect((await POST(request())).status).toBe(401);
    expect(state.insert).not.toHaveBeenCalled();
  });
});
