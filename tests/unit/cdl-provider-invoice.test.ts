import { beforeEach, describe, expect, it, vi } from 'vitest';
const { context, upload, insert } = vi.hoisted(() => ({
  context: { current: null as any },
  upload: vi.fn(),
  insert: vi.fn(),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/auth/require-program-holder', () => ({
  requireProgramHolder: vi.fn(async () => context.current),
}));
import { POST } from '@/apps/lms/app/api/program-holder/documents/route';
function request(type = 'application/pdf') {
  const file = new File(['invoice'], 'invoice.pdf', { type });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new ArrayBuffer(7) });
  return {
    formData: async () => ({ get: (key: string) => (key === 'file' ? file : 'provider_invoice') }),
  } as any;
}
describe('CDL Academy invoice submission', () => {
  beforeEach(() => {
    upload.mockReset();
    insert.mockReset();
    upload.mockResolvedValue({ error: null });
    insert.mockReturnValue({
      select: () => ({
        single: async () => ({ data: { id: 'document', status: 'pending' }, error: null }),
      }),
    });
    context.current = {
      mode: 'holder',
      holderId: 'academy',
      user: { id: 'holder-user' },
      db: {
        from: (table: string) =>
          table === 'program_holders'
            ? {
                select: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: { organization_name: 'The CDL Academy' },
                      error: null,
                    }),
                  }),
                }),
              }
            : { insert },
        storage: { from: () => ({ upload, remove: vi.fn() }) },
      },
    };
  });
  it('stores an academy invoice for review without approving or paying it', async () => {
    expect((await POST(request())).status).toBe(201);
    expect(upload.mock.calls[0][0]).toMatch(/^program-holders\/academy\/provider_invoice\//);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'holder-user',
        document_type: 'provider_invoice',
        status: 'pending',
        approved: false,
      }),
    );
  });
  it('rejects an administrator session without a holder identity', async () => {
    context.current.mode = 'admin';
    expect((await POST(request())).status).toBe(403);
    expect(upload).not.toHaveBeenCalled();
  });
  it('rejects invoice submission by a different partner', async () => {
    context.current.db.from = () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { organization_name: 'Other partner' }, error: null }),
        }),
      }),
    });
    expect((await POST(request())).status).toBe(403);
    expect(upload).not.toHaveBeenCalled();
  });
  it('keeps video out of the invoice submission flow', async () => {
    expect((await POST(request('video/mp4'))).status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });
});
