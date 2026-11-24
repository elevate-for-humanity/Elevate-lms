// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  notify: vi.fn(),
  admin: vi.fn(),
  insert: vi.fn(),
  saved: { data: { id: 'intake-1', created_at: '2026-11-24T15:00:00Z' }, error: null } as any,
}));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: state.admin }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/applications/submission-notifications', () => ({ notifyApplicationSubmission: state.notify }));
import { POST } from '@/apps/marketing/app/api/program-holder/apply/route';
import { unresolvedProgramHolderInterest } from '@/lib/program-holder/program-interest';
import { VALID_SLUGS } from '@/lib/program-registry';

const identity = { organizationName: 'Fixture Cleaning Company', contactName: 'Fixture Contact', email: 'owner@fixture.test', programTypes: ['skilled_trades'] };
const request = (body: Record<string, unknown>) => new Request('https://www.elevateforhumanity.org/api/program-holder/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...identity, ...body }) });

beforeEach(() => {
  vi.clearAllMocks();
  state.saved = { data: { id: 'intake-1', created_at: '2026-11-24T15:00:00Z' }, error: null };
  state.notify.mockResolvedValue({ applicant: 'sent', staff: 'sent' });
  state.insert.mockImplementation(() => ({ select: () => ({ maybeSingle: async () => state.saved }) }));
  state.admin.mockResolvedValue({ from: () => ({ insert: state.insert }) });
});

describe('janitorial program-holder scope review', () => {
  it('records the requested scope without inventing an active program or assigning a different course', async () => {
    const response = await POST(request({ requestedProgramSlugs: [], requestedProgramInterest: 'janitorial' }));
    expect(response.status).toBe(201);
    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({
      application_type: 'program_holder',
      payload: expect.objectContaining({ requested_program_slugs: [], requested_program_interest: 'janitorial' }),
    }));
    expect(state.notify).toHaveBeenCalledWith(expect.objectContaining({ applicantHtml: expect.stringContaining('Janitorial / Building Services Technician'), staffHtml: expect.stringContaining('program scope review') }));
    expect(VALID_SLUGS.has('janitorial')).toBe(false);
  });

  it.each([
    {},
    { requestedProgramInterest: 'unverified-provider-approval' },
    { requestedProgramSlugs: ['janitorial'] },
    { requestedProgramSlugs: ['commercial-cleaning'] },
    { requestedProgramSlugs: ['hvac-technician'], requestedProgramInterest: 'janitorial' },
  ])('rejects missing, unknown, or ambiguous program scope: %j', async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(state.insert).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
  });

  it('preserves existing canonical program submissions', async () => {
    expect((await POST(request({ requestedProgramSlugs: ['hvac-technician'] }))).status).toBe(201);
    expect(state.insert.mock.calls[0][0].payload.requested_program_slugs).toEqual(['hvac-technician']);
    expect(state.insert.mock.calls[0][0].payload).not.toHaveProperty('requested_program_interest');
  });

  it('does not send a success notification when the database write fails', async () => {
    state.saved = { data: null, error: { message: 'database unavailable' } };
    expect((await POST(request({ requestedProgramInterest: 'janitorial' }))).status).toBe(500);
    expect(state.notify).not.toHaveBeenCalled();
  });

  it('requires an actual program link before a scope request can be approved', () => {
    for (const slugs of [undefined, [], [''], [null], [123]]) {
      expect(unresolvedProgramHolderInterest({ requested_program_interest: 'janitorial', requested_program_slugs: slugs })).toBe(true);
    }
    expect(unresolvedProgramHolderInterest({ requested_program_interest: 'janitorial', requested_program_slugs: ['verified-program'] })).toBe(false);
    expect(unresolvedProgramHolderInterest({ requested_program_slugs: ['hvac-technician'] })).toBe(false);
  });
});
