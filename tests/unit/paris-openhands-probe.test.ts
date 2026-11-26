import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { resolveOpenHandsCorrelationId } from '@/lib/devstudio/openhands/correlation';
import { openHandsProbeTestStatus } from '@/lib/devstudio/openhands/probe-status';

// PR3 (#2524): dispatch must carry a correlation id (the unique claim only
// fires when one exists) and a live probe must be recorded as test_status.

it('keeps a supplied correlation id and generates a fresh UUID when missing', () => {
  expect(resolveOpenHandsCorrelationId('  abc-123  ')).toBe('abc-123');
  const generated = resolveOpenHandsCorrelationId(null);
  expect(generated).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(resolveOpenHandsCorrelationId('')).not.toBe(generated);
  expect(resolveOpenHandsCorrelationId(undefined)).not.toBe(generated);
});

it('maps only a verified probe to test_status ok', () => {
  expect(openHandsProbeTestStatus({ verified: true, status: 'read_authorization_verified' })).toBe('ok');
  for (const status of [
    'not_configured',
    'origin_not_verified',
    'authorization_failed',
    'provider_http_failure',
    'provider_request_failed',
    'configuration_unavailable',
  ]) {
    expect(openHandsProbeTestStatus({ verified: false, status })).toBe('error');
  }
});

const h = vi.hoisted(() => ({ config: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock('@/lib/devstudio/openhands/client', () => ({ getHydratedOpenHandsConfig: h.config }));
vi.mock('@/lib/health/service-health', () => ({
  getRuntimeReadiness: () => ({ commit: 'a'.repeat(40), revision: 'admin-fixture' }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => ({ update: h.update }),
  }),
}));
import { probeAndRecordOpenHandsReadiness } from '@/lib/devstudio/paris-openhands-readiness';

beforeEach(() => {
  h.config.mockReset();
  h.config.mockResolvedValue({
    apiKey: 'private-fixture-key',
    origin: 'https://app.all-hands.dev',
    configuredRepository: 'elevate-for-humanity/Elevate-lms',
  });
  h.update.mockReset();
  h.eq.mockReset();
  h.update.mockReturnValue({ eq: h.eq });
  h.eq.mockResolvedValue({ error: null });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ items: [{ id: 'private-task' }] })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it('records a verified probe as test_status ok with last_tested', async () => {
  const result = await probeAndRecordOpenHandsReadiness();
  expect(result).toMatchObject({
    verified: true,
    status: 'read_authorization_verified',
    probeRecorded: true,
    probeTestStatus: 'ok',
  });
  expect(h.update).toHaveBeenCalledOnce();
  const [values] = h.update.mock.calls[0];
  expect(values.test_status).toBe('ok');
  expect(typeof values.last_tested).toBe('string');
  expect(h.eq).toHaveBeenCalledWith('key', 'OPENHANDS_API_KEY');
  expect(JSON.stringify(result)).not.toContain('private-fixture-key');
});

it('records a failed probe as test_status error without masking the probe', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('private upstream', { status: 401 }));
  const result = await probeAndRecordOpenHandsReadiness();
  expect(result).toMatchObject({ verified: false, status: 'authorization_failed', probeRecorded: true, probeTestStatus: 'error' });
  expect(h.update.mock.calls[0][0].test_status).toBe('error');
});

it('reports probeRecorded false when the recording write fails, probe result intact', async () => {
  h.eq.mockResolvedValueOnce({ error: { message: 'db down' } });
  const result = await probeAndRecordOpenHandsReadiness();
  expect(result).toMatchObject({ verified: true, probeRecorded: false, probeTestStatus: 'ok' });
});
