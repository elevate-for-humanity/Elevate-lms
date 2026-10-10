import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rate: vi.fn(),
  rpc: vi.fn(),
  read: vi.fn(),
  admin: vi.fn(),
}));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: mocks.auth }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rate }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
import { POST } from '@/apps/admin/app/api/admin/apprenticeships/hours/approve/route';

const id = '12345678-1234-4234-9234-123456789012';
const expected = [
  {
    id,
    apprentice_id: 'student-id',
    program_id: 'program-id',
    work_date: '2026-10-06',
    hours_worked: 8,
  },
];
const actor = 'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa';
function request(body: unknown) {
  return new NextRequest('https://admin.example.test/api/admin/apprenticeships/hours/approve', {
    method: 'POST',
    body: JSON.stringify({ expected, ...(body as object) }),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.rate.mockResolvedValue(null);
  mocks.auth.mockResolvedValue({ id: actor });
  mocks.admin.mockResolvedValue({
    rpc: mocks.rpc,
    from: () => ({ select: () => ({ in: mocks.read }) }),
  });
  mocks.rpc.mockResolvedValue({ data: 1, error: null });
  mocks.read.mockResolvedValue({
    data: [{ id, status: 'verified', verified_by: actor, verified_at: '2026-10-10T12:00:00Z' }],
    error: null,
  });
});
describe('guarded hours approval', () => {
  it('requires an authenticated admin before accessing the database', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });
    expect((await POST(request({ ids: [id] }))).status).toBe(403);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('uses the session actor, ignoring any approver in the client body', async () => {
    const response = await POST(request({ ids: [id], approver: 'spoofed' }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('admin_verify_apprenticeship_hours', {
      p_ids: [id],
      p_approver_id: actor,
      p_expected: expected,
    });
    expect(await response.json()).toMatchObject({ ok: true, approvedCount: 1 });
  });
  it.each([[], [id, id], ['invalid'], Array(201).fill(id)])(
    'rejects invalid ID batches',
    async (ids) => {
      expect((await POST(request({ ids }))).status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it('requires the reviewed values in addition to IDs', async () => {
    expect((await POST(request({ ids: [id], expected: [] }))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('reports a database eligibility conflict without a fake success', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'P0001' } });
    expect((await POST(request({ ids: [id] }))).status).toBe(409);
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('requires persisted status and attribution in the readback', async () => {
    mocks.read.mockResolvedValue({ data: [{ id, status: 'submitted' }], error: null });
    expect((await POST(request({ ids: [id] }))).status).toBe(409);
  });
  it('accepts a retry only when the entry is already verified in the database', async () => {
    mocks.rpc.mockResolvedValue({ data: 0, error: null });
    expect(await (await POST(request({ ids: [id] }))).json()).toMatchObject({
      ok: true,
      approvedCount: 0,
    });
  });
});
