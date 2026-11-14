import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ process: vi.fn(), hydrate: vi.fn() }));
vi.mock('@/lib/platform/orchestration/dispatcher', () => ({ processPendingPlatformEvents: mocks.process }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: mocks.hydrate }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { POST } from '@/apps/admin/app/api/internal/workflow-event-processor/route';

describe('scheduled workflow event dispatch', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'event-processor-test-secret');
    mocks.process.mockReset();
    mocks.hydrate.mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  function request(authorization = 'Bearer event-processor-test-secret', suffix = '') {
    return new NextRequest(`https://admin.example.test/api/internal/workflow-event-processor${suffix}`, {
      method: 'POST', headers: { authorization },
    });
  }

  it('calls the canonical claiming dispatcher with the bounded batch size', async () => {
    mocks.process.mockResolvedValue({ claimed: 1, processed: 1, failed: 0, workflowRuns: 1, eventIds: ['event-1'] });
    const response = await POST(request(undefined, '?limit=999'));
    expect(response.status).toBe(200);
    expect(mocks.process).toHaveBeenCalledWith(100);
    expect((await response.json()).workflowRuns).toBe(1);
  });

  it('rejects unauthenticated callers before claiming events', async () => {
    const response = await POST(request('Bearer wrong'));
    expect(response.status).toBe(401);
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it('makes a partially failed batch fail the scheduler HTTP gate', async () => {
    mocks.process.mockResolvedValue({ claimed: 2, processed: 1, failed: 1, workflowRuns: 1, eventIds: ['event-1', 'event-2'] });
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).failed).toBe(1);
  });

  it('does not conceal a broken database claim', async () => {
    mocks.process.mockRejectedValue(new Error('claim failed'));
    expect((await POST(request())).status).toBe(500);
  });

  it('preserves the historical backlog review gate and its zero-claim receipt', async () => {
    const blocked = { claimed: 0, processed: 0, failed: 0, workflowRuns: 0, eventIds: [],
      blocked: 'historical_backlog_review_required', backlogCount: 1542, cutoff: '2026-10-21T12:00:00.000Z' };
    mocks.process.mockResolvedValue(blocked);
    const response = await POST(request(undefined, '?allowHistoricalReplay=true'));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(blocked);
    expect(mocks.process).toHaveBeenCalledWith(20);
  });
});
