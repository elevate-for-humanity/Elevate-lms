// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ sign: vi.fn(), from: vi.fn(), limited: vi.fn(), admin: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ storage: { from: m.from } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: m.admin }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: m.limited }));
import { signAuthenticatedFile } from '@/lib/storage/authenticated-signing';
const run = (query = 'bucket=documents&path=student/owned.pdf') =>
  signAuthenticatedFile(new Request(`https://app.elevateforhumanity.org/api/storage/signed-url?${query}`), 'student', 'lms');
beforeEach(() => {
  vi.clearAllMocks();
  m.from.mockReturnValue({ createSignedUrl: m.sign });
  m.sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example/signed' }, error: null });
  m.limited.mockResolvedValue(null);
});
describe('session-authorized file signing', () => {
  it('uses the caller storage policies, bounded lifetime and private responses', async () => {
    const response = await run();
    expect(response.status).toBe(200);
    expect(m.sign).toHaveBeenCalledWith('student/owned.pdf', 300);
    expect(m.limited).toHaveBeenCalledWith(expect.any(Request), 'api', { key: 'storage-sign:student' });
    expect(m.admin).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('never returns a signed URL when the session RLS denies the file', async () => {
    m.sign.mockResolvedValue({ data: null, error: { message: 'secret internal policy details' } });
    const response = await run('bucket=documents&path=other-student/private.pdf');
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('secret');
    expect(m.admin).not.toHaveBeenCalled();
  });
  it.each(['../private.pdf', 'student/../private.pdf', '%252e%252e/private.pdf', 'student%5Cprivate.pdf', '/private.pdf', 'student//private.pdf'])(
    'rejects ambiguous object path %s before accessing storage', async path => {
      expect((await run(`bucket=documents&path=${encodeURIComponent(path)}`)).status).toBe(400);
      expect(m.from).not.toHaveBeenCalled();
    });
  it.each(['0', '-1', '3601', 'NaN', '5x', '1.5'])( 'rejects unsafe expiry %s', async expiry => {
    expect((await run(`bucket=documents&path=own.pdf&expiresIn=${expiry}`)).status).toBe(400);
    expect(m.sign).not.toHaveBeenCalled();
  });
  it('stops repeated signing before storage', async () => {
    m.limited.mockResolvedValue(new Response('{}', { status: 429, headers: { 'Retry-After': '60' } }));
    expect((await run()).status).toBe(429);
    expect(m.sign).not.toHaveBeenCalled();
  });
  it('does not leak provider exceptions', async () => {
    m.sign.mockRejectedValue(new Error('private token'));
    const response = await run();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private token');
  });
});
