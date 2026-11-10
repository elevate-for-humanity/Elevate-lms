import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { emptyWorkbookAnswers } from '@/lib/lms/workbook-validation';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  sections: {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    lt: vi.fn(),
  },
  reviews: {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn(),
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
    rpc: mocks.rpc,
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { POST } from '@/apps/lms/app/api/workbooks/sections/[sectionId]/route';
const section = '11111111-1111-4111-8111-111111111111';
const request = (body: unknown, origin?: string) =>
  new NextRequest('https://app.elevateforhumanity.org/api/workbooks/sections/' + section, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-workbook-owner': 'current-user',
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
const save = { answers: emptyWorkbookAnswers(), reviewed: false, expectedVersion: 0 };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation((table: string) => {
    if (table === 'digital_workbook_sections') return mocks.sections;
    if (table === 'digital_workbook_responses') return mocks.reviews;
    throw new Error(`Unexpected workbook table: ${table}`);
  });
  mocks.sections.maybeSingle.mockResolvedValue({
    data: { workbook_id: 'workbook', section_number: 1, prompts: [] },
    error: null,
  });
  mocks.sections.lt.mockResolvedValue({ data: [], error: null });
  mocks.reviews.in.mockResolvedValue({ data: [], error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'current-user' } }, error: null });
});
describe('Workbook API', () => {
  it('rejects a workbook left open under a different signed-in account', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ section_id: section, version: 1 }], error: null });
    const stale = request(save);
    stale.headers.set('x-workbook-owner', 'previous-account');
    expect((await POST(stale, { params: Promise.resolve({ sectionId: section }) })).status).toBe(
      409,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('accepts the canonical LMS origin behind the Google service proxy', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ section_id: section, version: 1 }], error: null });
    const forwarded = new NextRequest('http://localhost:8080/api/workbooks/sections/' + section, {
      method: 'POST',
      headers: {
        origin: 'https://app.elevateforhumanity.org',
        'Content-Type': 'application/json',
        'x-workbook-owner': 'current-user',
      },
      body: JSON.stringify(save),
    });
    expect(
      (await POST(forwarded, { params: Promise.resolve({ sectionId: section }) })).status,
    ).toBe(200);
  });
  it('accepts the live LMS hostname when the configured app origin uses the legacy alias', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.elevateforhumanity.org');
    mocks.rpc.mockResolvedValue({ data: [{ section_id: section, version: 1 }], error: null });
    try {
      const forwarded = new NextRequest('http://localhost:8080/api/workbooks/sections/' + section, {
        method: 'POST',
        headers: {
          origin: 'https://lms.elevateforhumanity.org',
          'Content-Type': 'application/json',
          'x-workbook-owner': 'current-user',
        },
        body: JSON.stringify(save),
      });
      expect(
        (await POST(forwarded, { params: Promise.resolve({ sectionId: section }) })).status,
      ).toBe(200);
      expect(mocks.rpc).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it.each(['https://other.example', 'https://lms.elevateforhumanity.org.attacker.example', 'null'])(
    'requires authentication and rejects cross-site saves from %s',
    async (origin) => {
      mocks.getUser.mockResolvedValue({ data: { user: null } });
      expect(
        (await POST(request(save), { params: Promise.resolve({ sectionId: section }) })).status,
      ).toBe(401);
      expect(
        (
          await POST(request(save, origin), {
            params: Promise.resolve({ sectionId: section }),
          })
        ).status,
      ).toBe(403);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it('passes no client user ID to the session-scoped RPC', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ section_id: section, version: 1, updated_at: 'now' }],
      error: null,
    });
    const result = await POST(request({ ...save, user_id: 'someone-else' }), {
      params: Promise.resolve({ sectionId: section }),
    });
    expect(result.status).toBe(200);
    expect(result.headers.get('Cache-Control')).toContain('no-store');
    expect(mocks.rpc).toHaveBeenCalledWith('save_digital_workbook_section', {
      p_section_id: section,
      p_answers: save.answers,
      p_reviewed: false,
      p_expected_version: 0,
    });
  });
  it.each([
    ['42501', 403],
    ['40001', 409],
    ['XX000', 503],
  ])('reports %s without claiming a save', async (code, status) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code } });
    expect(
      (await POST(request(save), { params: Promise.resolve({ sectionId: section }) })).status,
    ).toBe(status);
  });
  it('requires earlier chapter review before advancing the reviewed checklist', async () => {
    mocks.sections.maybeSingle.mockResolvedValue({
      data: { workbook_id: 'workbook', section_number: 2, prompts: [] },
      error: null,
    });
    mocks.sections.lt.mockResolvedValue({ data: [{ id: 'earlier' }], error: null });
    const response = await POST(
      request({
        ...save,
        reviewed: true,
        answers: {
          ...save.answers,
          notes: 'Meaningful study notes',
          nextGoal: 'My next learning goal',
        },
      }),
      { params: Promise.resolve({ sectionId: section }) },
    );
    expect(response.status).toBe(409);
    expect(mocks.sections.eq).toHaveBeenCalledWith('workbook_id', 'workbook');
    expect(mocks.sections.lt).toHaveBeenCalledWith('section_number', 2);
    expect(mocks.reviews.eq).toHaveBeenCalledWith('user_id', 'current-user');
    expect(mocks.reviews.eq).toHaveBeenCalledWith('reviewed', true);
    expect(mocks.reviews.in).toHaveBeenCalledWith('section_id', ['earlier']);
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.reviews.in.mockResolvedValue({ data: [{ section_id: 'earlier' }], error: null });
    mocks.rpc.mockResolvedValue({ data: [{ section_id: section, version: 1 }], error: null });
    const allowed = await POST(
      request({
        ...save,
        reviewed: true,
        answers: {
          ...save.answers,
          notes: 'Meaningful study notes',
          nextGoal: 'My next learning goal',
        },
      }),
      { params: Promise.resolve({ sectionId: section }) },
    );
    expect(allowed.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it('preserves drafts in accessible later chapters without advancing their review', async () => {
    mocks.sections.maybeSingle.mockResolvedValue({
      data: { workbook_id: 'workbook', section_number: 7, prompts: [] },
      error: null,
    });
    mocks.sections.lt.mockResolvedValue({ data: [{ id: 'earlier' }], error: null });
    mocks.rpc.mockResolvedValue({ data: [{ section_id: section, version: 1 }], error: null });
    const response = await POST(request(save), { params: Promise.resolve({ sectionId: section }) });
    expect(response.status).toBe(200);
    expect(mocks.reviews.in).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_digital_workbook_section',
      expect.objectContaining({ p_reviewed: false }),
    );
  });
  it('does not mark unfinished writing as reviewed', async () => {
    const response = await POST(request({ ...save, reviewed: true }), {
      params: Promise.resolve({ sectionId: section }),
    });
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects malformed fields before any database write', async () => {
    expect(
      (
        await POST(request({ ...save, answers: { notes: 2 } }), {
          params: Promise.resolve({ sectionId: section }),
        })
      ).status,
    ).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
