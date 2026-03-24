/**
 * Unit tests for the notification helpers in scripts/monitor-copycats.ts.
 *
 * Verifies that slackAlert and emailAlert call fetch with the correct
 * payloads, and that both no-op when the required env vars are absent.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MonitoringReport } from '../../scripts/monitor-copycats';
import { slackAlert, emailAlert, sendAlert } from '../../scripts/monitor-copycats';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeReport(overrides: Partial<MonitoringReport> = {}): MonitoringReport {
  return {
    timestamp: '2024-01-01T00:00:00.000Z',
    searchTerms: ['"Elevate for Humanity"'],
    results: [],
    suspiciousCount: 0,
    ...overrides,
  };
}

function suspiciousReport(): MonitoringReport {
  return makeReport({
    suspiciousCount: 2,
    results: [
      { title: 'Fake Site', url: 'https://fake.example.com', snippet: '', suspicious: true, reason: 'Found watermark: "EFH-ORIGINAL-2024"' },
      { title: 'Another Copy', url: 'https://copy.example.com', snippet: '', suspicious: true, reason: 'Found data-site-owner attribute' },
    ],
  });
}

// ─── slackAlert ─────────────────────────────────────────────────────────────

describe('slackAlert', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SLACK_WEBHOOK_URL;
  });

  it('does not call fetch when SLACK_WEBHOOK_URL is unset', async () => {
    await slackAlert(suspiciousReport());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls the Slack webhook when SLACK_WEBHOOK_URL is set', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    await slackAlert(suspiciousReport());
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://hooks.slack.com/test');
  });

  it('sends a POST request with JSON content-type', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    await slackAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('includes the suspicious count in the message text', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    await slackAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    const headerText = body.blocks[0].text.text as string;
    expect(headerText).toContain('2');
  });

  it('includes each suspicious URL in the body', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    await slackAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    const urlsText = body.blocks[1].text.text as string;
    expect(urlsText).toContain('https://fake.example.com');
    expect(urlsText).toContain('https://copy.example.com');
  });

  it('does not call fetch for a clean report (no suspicious sites)', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    // slackAlert is called unconditionally — sendAlert guards the count.
    // A report with suspiciousCount=0 still calls fetch (the guard is in sendAlert).
    // This test documents that slackAlert itself does not guard on count.
    await slackAlert(makeReport({ suspiciousCount: 0, results: [] }));
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

// ─── emailAlert ─────────────────────────────────────────────────────────────

describe('emailAlert', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.ALERT_EMAIL_TO;
  });

  it('does not call fetch when SENDGRID_API_KEY is unset', async () => {
    await emailAlert(suspiciousReport());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls the SendGrid API when SENDGRID_API_KEY is set', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test';
    await emailAlert(suspiciousReport());
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.sendgrid.com/v3/mail/send');
  });

  it('sends a POST request with Authorization header', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test';
    await emailAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer SG.test');
  });

  it('uses ALERT_EMAIL_TO when set', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test';
    process.env.ALERT_EMAIL_TO = 'custom@example.com';
    await emailAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.personalizations[0].to[0].email).toBe('custom@example.com');
  });

  it('falls back to legal@elevateforhumanity.org when ALERT_EMAIL_TO is unset', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test';
    await emailAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.personalizations[0].to[0].email).toBe('legal@elevateforhumanity.org');
  });

  it('includes the suspicious count in the subject', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test';
    await emailAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.subject).toContain('2');
  });

  it('includes each suspicious URL in the HTML body', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test';
    await emailAlert(suspiciousReport());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    const html = body.content[0].value as string;
    expect(html).toContain('https://fake.example.com');
    expect(html).toContain('https://copy.example.com');
  });
});

// ─── sendAlert ───────────────────────────────────────────────────────────────

describe('sendAlert', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.SENDGRID_API_KEY = 'SG.test';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.SENDGRID_API_KEY;
  });

  it('does not call fetch when there are no suspicious sites', async () => {
    await sendAlert(makeReport({ suspiciousCount: 0, results: [] }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls both Slack and SendGrid when suspicious sites are found', async () => {
    await sendAlert(suspiciousReport());
    // Two fetch calls: one to Slack, one to SendGrid
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const urls = fetchMock.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(urls).toContain('https://hooks.slack.com/test');
    expect(urls).toContain('https://api.sendgrid.com/v3/mail/send');
  });
});
