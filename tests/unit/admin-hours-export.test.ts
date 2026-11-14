import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const state = vi.hoisted(() => ({
  authError: null as Response | null,
  load: vi.fn(),
  audit: vi.fn(),
  db: {},
}));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: async () => ({ id: 'admin', error: state.authError }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => state.db }));
vi.mock('@/lib/apprenticeship/admin-hours', () => ({ loadAdminHours: state.load }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: state.audit, AuditActions: { DATA_EXPORTED: 'data_exported' } }));
vi.mock('@/lib/api/safe-error', () => ({ safeInternalError: () => NextResponse.json({ error: 'Could not export hours.' }, { status: 500 }) }));
import { GET } from '@/apps/admin/app/api/admin/apprenticeships/hours/export/route';

const request = (query = 'start_date=2026-10-01&end_date=2026-10-24') => new NextRequest(`https://admin.elevateforhumanity.org/api/admin/apprenticeships/hours/export?${query}`);
const entry = (id: string, work_date: string, status = 'verified', hours_worked = 2) => ({ id, work_date, status, hours_worked, name: 'Test Student', email: 'fixture@example.test', program_title: 'Test program', notes: null });
beforeEach(() => {
  vi.clearAllMocks();
  state.authError = null;
  state.load.mockResolvedValue({ entries: [entry('start', '2026-10-01'), entry('end', '2026-10-24'), entry('outside', '2026-09-30'), entry('pending', '2026-10-12', 'submitted'), entry('zero', '2026-10-12', 'verified', 0)] });
});

describe('OJT export contract', () => {
  it('uses the Student Hours data and includes date boundaries without converting zero hours', async () => {
    const response = await GET(request());
    const csv = await response.text();
    expect(state.load).toHaveBeenCalledWith(state.db);
    expect(csv).toContain('"start"');
    expect(csv).toContain('"end"');
    expect(csv).not.toContain('"outside"');
    expect(csv).toContain('"0","verified"');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ resourceType: 'apprenticeship_ojt_hours', metadata: expect.objectContaining({ count: 4 }) }));
  });
  it('exports only verified records when that filter is selected', async () => {
    const csv = await (await GET(request('start_date=2026-10-01&end_date=2026-10-24&status=verified'))).text();
    expect(csv).not.toContain('"pending"');
    expect(csv).toContain('"zero"');
  });
  it.each(['start_date=2026-02-30&end_date=2026-10-24', 'start_date=2026-10-24&end_date=2026-10-01', 'start_date=2026-10-01&end_date=2026-10-24&status=anything'])('rejects invalid filters before accessing records: %s', async (query) => {
    expect((await GET(request(query))).status).toBe(400);
    expect(state.load).not.toHaveBeenCalled();
  });
  it('escapes CSV quotes, line breaks, and spreadsheet formulas', async () => {
    state.load.mockResolvedValue({ entries: [{ ...entry('row', '2026-10-01'), name: '=1+1', notes: 'a,"quote"\nnext' }] });
    const csv = await (await GET(request())).text();
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"a,""quote""\nnext"');
  });
  it('keeps unauthorized callers outside the data loader', async () => {
    state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    expect((await GET(request())).status).toBe(401);
    expect(state.load).not.toHaveBeenCalled();
  });
  it('returns an error instead of a successful empty export when loading fails', async () => {
    state.load.mockRejectedValueOnce(new Error('unavailable'));
    expect((await GET(request())).status).toBe(500);
    expect(state.audit).not.toHaveBeenCalled();
  });
});
