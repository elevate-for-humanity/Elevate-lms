// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ generate: vi.fn(), email: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ auth: { admin: { generateLink: mocks.generate } } }) }));
vi.mock('@/lib/email', () => ({ sendEmail: mocks.email }));
import { passwordResetHandler } from '@/lib/auth/password-recovery-route';
beforeEach(() => { vi.clearAllMocks(); mocks.generate.mockResolvedValue({ data: { properties: { hashed_token: 'test-one-time-token' } }, error: null }); mocks.email.mockResolvedValue({ success: true }); });
it('keeps new Host Shop passwords and permanent login on the Host Shop onboarding path', async () => {
 const response = await passwordResetHandler('https://app.elevateforhumanity.org')(new NextRequest('https://untrusted.example/api/auth/password-reset', { method: 'POST', body: JSON.stringify({ email: 'host@example.com', portal: 'host-shop' }) }));
 expect(response.status).toBe(200);
 const message = mocks.email.mock.calls[0][0];
 const link = new URL(message.text.match(/https:\/\/\S+/)[0]);
 expect(link.origin).toBe('https://app.elevateforhumanity.org');
 expect(link.searchParams.get('next')).toBe('/reset-password?portal=host-shop&mode=recovery');
 expect(message.text).toContain('https://app.elevateforhumanity.org/host-shop/login');
 expect(JSON.stringify(await response.json())).not.toContain('test-one-time-token');
});
