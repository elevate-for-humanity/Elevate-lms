import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ user: { id: 'owner' } as { id: string } | null, adminError: true,
  row: { user_id: 'owner', storage_bucket: 'credential-uploads', storage_path: 'owner/program/result.pdf' },
  signed: vi.fn(async () => ({ data: { signedUrl: 'https://files.example.test/private?token=short-lived' }, error: null })),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mock.user } }) } }) }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => ({ error: mock.adminError ? new Response(null, { status: 403 }) : undefined }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mock.row, error: null }) }) }) }), storage: { from: () => ({ createSignedUrl: mock.signed }) } }) }));
import { credentialDocumentPreview } from '@/lib/credentials/document-preview';
const id = '00000000-0000-4000-8000-000000000001';
beforeEach(() => { mock.user = { id: 'owner' }; mock.adminError = true; mock.row.storage_path = 'owner/program/result.pdf'; mock.signed.mockClear(); });
describe('private credential access boundary', () => {
  it('requires authentication', async () => {
    mock.user = null;
    expect((await credentialDocumentPreview(new Request('https://app.example.test'), id)).status).toBe(401);
    expect(mock.signed).not.toHaveBeenCalled();
  });
  it('denies another student without issuing any storage URL', async () => {
    mock.user = { id: 'other-student' };
    expect((await credentialDocumentPreview(new Request('https://app.example.test'), id)).status).toBe(404);
    expect(mock.signed).not.toHaveBeenCalled();
  });
  it('permits the owner with a short-lived private response', async () => {
    const response = await credentialDocumentPreview(new Request('https://app.example.test'), id);
    expect(response.status).toBe(307);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mock.signed).toHaveBeenCalledWith('owner/program/result.pdf', 60);
  });
  it('permits a verified administrator', async () => {
    mock.user = { id: 'administrator' }; mock.adminError = false;
    expect((await credentialDocumentPreview(new Request('https://admin.example.test'), id)).status).toBe(307);
  });
  it('refuses a corrupted path into another user directory', async () => {
    mock.row.storage_path = 'other-student/private.pdf';
    expect((await credentialDocumentPreview(new Request('https://app.example.test'), id)).status).toBe(409);
    expect(mock.signed).not.toHaveBeenCalled();
  });
});
