import { describe, expect, it, vi } from 'vitest';
import { CLOUD_BUDGET_NAME, parseCloudBudget, refreshCloudBudget } from '@/lib/gcp/cloud-budget';

const now = Date.parse('2026-11-07T06:00:00Z');
const data = { budgetDisplayName: CLOUD_BUDGET_NAME, currencyCode: 'USD', costAmount: 90.01, budgetAmount: 100, costIntervalStart: '2026-11-01T00:00:00Z' };
const message = (patch = {}) => ({ data: Buffer.from(JSON.stringify({ ...data, ...patch })).toString('base64'), publishTime: '2026-11-07T05:00:00Z' });

describe('Google Cloud budget evidence', () => {
  it('accepts provider-reported zero and the exact $90 crossing', () => {
    expect(parseCloudBudget(message(), now)?.costAmount).toBe(90.01);
    expect(parseCloudBudget(message({ costAmount: 0 }), now)?.costAmount).toBe(0);
  });
  it.each([{ costAmount: '90' }, { costAmount: -1 }, { currencyCode: 'CAD' }, { budgetAmount: 1000 }, { budgetDisplayName: 'Another budget' }, { costIntervalStart: '2026-10-01T00:00:00Z' }])('rejects foreign or invalid billing evidence %j', patch => {
    expect(parseCloudBudget(message(patch), now)).toBeNull();
  });
  it('rejects malformed or future reports', () => {
    expect(parseCloudBudget({ data: 'invalid' }, now)).toBeNull();
    expect(parseCloudBudget({ ...message(), publishTime: '2027-01-01T00:00:00Z' }, now)).toBeNull();
  });
  it('never acknowledges a report if durable storage fails', async () => {
    const request = vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'server-only' }))
      .mockResolvedValueOnce(Response.json({ receivedMessages: [{ ackId: 'ack-1', message: message({ costIntervalStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() }) }] }));
    const db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ error: new Error('db unavailable') }) }) }) }) };
    await expect(refreshCloudBudget(db as any, request)).rejects.toThrow('CLOUD_BUDGET_STORAGE_UNAVAILABLE');
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.every(([url]) => !String(url).includes('acknowledge'))).toBe(true);
  });
});
