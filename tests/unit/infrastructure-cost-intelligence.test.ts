import { describe, expect, it } from 'vitest';
import { buildCostRecommendations } from '@/lib/admin/infrastructure-cost-intelligence';

describe('infrastructure cost intelligence', () => {
  it('blocks wasteful dispatch when queued jobs cannot reach the GPU', () => {
    const result = buildCostRecommendations({ gpuReady: false, queued: 4, rendering: 0, stale: 0, repeatedRetries: 0, storageFailures: 0, deadLettered: 0, failedAttemptCost: null });
    expect(result[0]).toMatchObject({ severity: 'critical', title: 'Queued work cannot reach the GPU' });
  });

  it('makes an idle healthy worker eligible to scale to zero', () => {
    const result = buildCostRecommendations({ gpuReady: true, queued: 0, rendering: 0, stale: 0, repeatedRetries: 0, storageFailures: 0, deadLettered: 0, failedAttemptCost: null });
    expect(result).toContainEqual(expect.objectContaining({ severity: 'opportunity', title: 'GPU is eligible to scale to zero' }));
  });

  it('prioritizes stale leases, retries, and storage failures', () => {
    const result = buildCostRecommendations({ gpuReady: true, queued: 2, rendering: 2, stale: 1, repeatedRetries: 3, storageFailures: 2, deadLettered: 1, failedAttemptCost: 8.25 });
    expect(result.map((item) => item.title)).toEqual([
      'Recover stale renders before starting new work',
      'Stop expensive retry loops',
      'Fix storage transfer failures first',
    ]);
    expect(result[1]?.estimatedMonthlySavings).toBe(8.25);
  });
});
