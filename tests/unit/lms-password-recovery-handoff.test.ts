// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), exchange: vi.fn(), cookies: undefined as any }));
vi.mock('@/lib/supabase/public-config', () => ({ getServerPublicSupabaseConfig: () => ({ url: 'https://fixture.supabase.co', anonKey: 'fixture-public-key' }) }));
vi.mock('@/lib/utils/site-urls', () => ({ siteUrls: { app: 'https://app.elevateforhumanity.org' } }));
vi.mock('@supabase/ssr', () => ({ createServerClient: (_url: string, _key: string, options: any) => {
  mocks.cookies = options.cookies;
  return { auth: { verifyOtp: mocks.verify, exchangeCodeForSession: mocks.exchange } };
} }));
import { GET, POST } from '@/apps/lms/app/api/auth/recovery-callback/route';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockImplementation(async () => {
    mocks.cookies.setAll([{ name: 'sb-fixture-auth-token', value: 'fixture-session', options: { path: '/', secure: true, sameSite: 'lax' } }]);
    return { data: { session: { user: { id: 'fixture-user' } } }, error: null };
  });
  mocks.exchange.mockResolvedValue({ data: { session: { user: { id: 'fixture-user' } } }, error: null });
});
function submit(next = '/reset-password?portal=employer&mode=recovery', origin = 'https://app.elevateforhumanity.org') {
  return new NextRequest('https://app.elevateforhumanity.org/api/auth/recovery-callback', {
    method: 'POST', headers: { origin }, body: new URLSearchParams({ token_hash: 'fixture-one-time-token', next }),
  });
}
it('does not consume recovery tokens during email previews', async () => {
  const response = await GET(new NextRequest('https://app.elevateforhumanity.org/api/auth/recovery-callback?token_hash=fixture-one-time-token'));
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('Continue to Password Setup');
  expect(mocks.verify).not.toHaveBeenCalled();
  expect(response.headers.get('referrer-policy')).toBe('same-origin');
});
it('persists the verified recovery session on the password-form redirect', async () => {
  const response = await POST(submit());
  expect(mocks.verify).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'fixture-one-time-token' });
  const destination = new URL(response.headers.get('location')!);
  expect(destination.pathname).toBe('/reset-password');
  expect(destination.searchParams.get('mode')).toBe('recovery');
  expect(destination.searchParams.get('portal')).toBe('employer');
  expect(response.headers.get('set-cookie')).toContain('fixture-session');
  expect(response.headers.get('set-cookie')).toContain('Domain=.elevateforhumanity.org');
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
});
it.each(['https://admin.elevateforhumanity.org/dashboard', '/login', '//evil.example'])('keeps recovery on the password form even for next=%s', async (next) => {
  const response = await POST(submit(next));
  expect(response.headers.get('location')).toBe('https://app.elevateforhumanity.org/reset-password?mode=recovery');
});
it('shows expired recovery on the reset page instead of an unrelated login screen', async () => {
  mocks.verify.mockResolvedValue({ data: { session: null }, error: new Error('expired') });
  const response = await POST(submit());
  expect(response.headers.get('location')).toContain('/reset-password?mode=recovery');
  expect(response.headers.get('location')).toContain('error=recovery_failed');
  expect(response.headers.get('set-cookie')).toBeNull();
});
it('rejects cross-origin recovery submissions without verifying a token', async () => {
  const response = await POST(submit(undefined, 'https://evil.example'));
  expect(response.status).toBe(403);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it('reports missing tokens without using any existing signed-in session', async () => {
  const response = await GET(new NextRequest('https://app.elevateforhumanity.org/api/auth/recovery-callback'));
  expect(response.headers.get('location')).toContain('error=missing_recovery_token');
  expect(mocks.verify).not.toHaveBeenCalled();
});

it.each(['null', ''])('rejects opaque or missing origins (%s) without consuming recovery tokens', async (origin) => {
  const response = await POST(submit(undefined, origin));
  expect(response.status).toBe(403);
  expect(mocks.verify).not.toHaveBeenCalled();
});
