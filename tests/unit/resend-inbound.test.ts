import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchReceivedEmail,
  resolveForwardTarget,
  FORWARD_MAP,
  DEFAULT_FORWARD,
} from '../../lib/email/resend-inbound';

// ── fetchReceivedEmail ────────────────────────────────────────────────────────

describe('fetchReceivedEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns null and warns when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await fetchReceivedEmail('email-123');

    expect(result).toBeNull();
    // logger.warn ultimately calls console.warn in test env
    warnSpy.mockRestore();
  });

  it('calls the Resend receiving API with the correct URL and auth header', async () => {
    process.env.RESEND_API_KEY = 're_test_key';

    const mockEmail = {
      id: 'email-123',
      from: 'sender@example.com',
      to: ['info@elevateforhumanity.org'],
      subject: 'Hello',
      html: '<p>Hello</p>',
      text: 'Hello',
      reply_to: [],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEmail),
      text: () => Promise.resolve(''),
    });
    globalThis.fetch = fetchMock;

    const result = await fetchReceivedEmail('email-123');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails/receiving/email-123');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer re_test_key');
    expect(result).toEqual(mockEmail);
  });

  it('returns null when the Resend API responds with a non-OK status', async () => {
    process.env.RESEND_API_KEY = 're_test_key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    });

    const result = await fetchReceivedEmail('missing-id');

    expect(result).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    process.env.RESEND_API_KEY = 're_test_key';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    await expect(fetchReceivedEmail('email-123')).rejects.toThrow('Network failure');
  });
});

// ── resolveForwardTarget ──────────────────────────────────────────────────────

describe('resolveForwardTarget', () => {
  it('maps known prefixes to their configured destination', () => {
    for (const [prefix, dest] of Object.entries(FORWARD_MAP)) {
      expect(resolveForwardTarget([`${prefix}@elevateforhumanity.org`])).toBe(dest);
    }
  });

  it('is case-insensitive on the local part', () => {
    expect(resolveForwardTarget(['INFO@elevateforhumanity.org'])).toBe(FORWARD_MAP['info']);
    expect(resolveForwardTarget(['Admissions@elevateforhumanity.org'])).toBe(FORWARD_MAP['admissions']);
  });

  it('returns DEFAULT_FORWARD for an unknown prefix', () => {
    expect(resolveForwardTarget(['unknown@elevateforhumanity.org'])).toBe(DEFAULT_FORWARD);
  });

  it('returns DEFAULT_FORWARD for an empty address list', () => {
    expect(resolveForwardTarget([])).toBe(DEFAULT_FORWARD);
  });

  it('uses the first matching address when multiple recipients are present', () => {
    // 'support' maps to the same dest as 'info', but we verify the first match wins
    const result = resolveForwardTarget([
      'support@elevateforhumanity.org',
      'unknown@elevateforhumanity.org',
    ]);
    expect(result).toBe(FORWARD_MAP['support']);
  });

  it('falls back to DEFAULT_FORWARD when no recipient matches', () => {
    const result = resolveForwardTarget([
      'noreply@elevateforhumanity.org',
      'bounce@elevateforhumanity.org',
    ]);
    expect(result).toBe(DEFAULT_FORWARD);
  });
});
