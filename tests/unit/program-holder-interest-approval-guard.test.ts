// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ from: vi.fn(), createUser: vi.fn(), sendEmail: vi.fn(), contractor: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: async () => ({ id: 'operator', email: 'operator@fixture.test' }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: state.from, auth: { admin: { createUser: state.createUser } } }) }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: state.sendEmail }));
vi.mock('@/lib/integrations/quickbooks-program-holder-contractor', () => ({ ensureProgramHolderQuickBooksContractor: state.contractor }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
import { POST } from '@/apps/admin/app/api/program-holder/applications/[id]/approve/route';

it('stops unresolved janitorial approval before creating accounts, granting roles, payments, or sending a message', async () => {
  const application = { id: 'application-1', organization_name: 'Fixture Company', contact_name: 'Fixture Contact', email: 'owner@fixture.test', status: 'pending', data: { requested_program_interest: 'janitorial', requested_program_slugs: [] } };
  state.from.mockImplementation((table) => {
    const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: table === 'program_holder_applications' ? application : null, error: null }) };
    return query;
  });
  const response = await POST(new NextRequest('https://admin.elevateforhumanity.org/api/program-holder/applications/application-1/approve', { method: 'POST' }), { params: Promise.resolve({ id: 'application-1' }) });
  expect(response.status).toBe(409);
  expect((await response.json()).error).toContain('program scope review');
  expect(state.from).toHaveBeenCalledTimes(2);
  expect(state.createUser).not.toHaveBeenCalled();
  expect(state.sendEmail).not.toHaveBeenCalled();
  expect(state.contractor).not.toHaveBeenCalled();
});
