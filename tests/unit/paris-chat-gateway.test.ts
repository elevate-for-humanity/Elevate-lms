import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  chat: vi.fn(),
  command: vi.fn(),
  partner: vi.fn(),
  user: vi.fn(),
}));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: mocks.chat }));
vi.mock('@/lib/paris/portal-read-tools', () => ({
  executePortalReadCommand: mocks.command,
  authenticatePartnerPortalGuidance: mocks.partner,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.user } }),
}));
vi.mock('@/lib/secrets', () => ({ refreshSecrets: async () => undefined }));
vi.mock('@/lib/api/withRuntime', () => ({ withRuntime: (fn: unknown) => fn }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_route: string, fn: unknown) => fn }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
import { POST } from '../../apps/lms/app/api/ai-chat/route';
const request = (message: string) =>
  new NextRequest('https://app.elevateforhumanity.org/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      context: { surface: 'portal', page: '/program-holder/dashboard' },
    }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.command.mockResolvedValue(null);
  mocks.partner.mockResolvedValue(true);
  mocks.user.mockResolvedValue({ data: { user: null } });
});
test('live scoped commands bypass inference entirely', async () => {
  mocks.command.mockResolvedValue('54 applicants await enrollment review.');
  const response = await POST(request('How many applicants?'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    reply: '54 applicants await enrollment review.',
    provider: 'portal-records',
  });
  expect(mocks.chat).not.toHaveBeenCalled();
});
test('signed partner guidance uses owned inference through the shared gateway', async () => {
  mocks.chat.mockResolvedValue({
    content: 'Draft: Please confirm your appointment.',
    provider: 'elevate',
  });
  const response = await POST(request('Draft a follow-up message'));
  expect(response.status).toBe(200);
  expect((await response.json()).reply).toMatch(/^Draft:/);
  expect(mocks.chat).toHaveBeenCalledWith(
    expect.objectContaining({ providerPolicy: 'owned-only' }),
  );
});
test('provider failure returns an error instead of a fabricated completed task', async () => {
  mocks.chat.mockRejectedValue(new Error('MODEL_OFFLINE'));
  const response = await POST(request('Draft a follow-up message'));
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.reply).toBeUndefined();
  expect(body.error).toContain('No message was sent and no record was changed');
});
test('unverified portal guidance cannot invoke inference', async () => {
  mocks.partner.mockResolvedValue(false);
  const response = await POST(request('Draft a follow-up message'));
  expect(response.status).toBe(403);
  expect(mocks.chat).not.toHaveBeenCalled();
});
