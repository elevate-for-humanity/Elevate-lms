import { describe, expect, it, vi } from 'vitest';
import { reserveCourseBuilderCredits } from '@/lib/course-builder/credits';
const input = {
  tenantId: 'tenant',
  userId: 'buyer',
  operation: 'generate' as const,
  idempotencyKey: 'request-1',
};
describe('Course Builder credit dispatch authorization', () => {
  it('allows a newly applied reservation', async () => {
    const db = {
      rpc: vi.fn().mockResolvedValue({ data: [{ success: true, applied: true, balance: 1000 }] }),
    } as any;
    expect(await reserveCourseBuilderCredits({ ...input, db })).toMatchObject({
      cost: 1500,
      balance: 1000,
    });
  });
  it('prevents repeated requests from dispatching work against the same debit', async () => {
    const db = {
      rpc: vi.fn().mockResolvedValue({ data: [{ success: true, applied: false, balance: 1000 }] }),
    } as any;
    await expect(reserveCourseBuilderCredits({ ...input, db })).rejects.toMatchObject({
      code: 'DUPLICATE_REQUEST',
    });
  });
  it('rejects an insufficient balance before dispatch', async () => {
    const db = {
      rpc: vi.fn().mockResolvedValue({ data: [{ success: false, applied: false, balance: 20 }] }),
    } as any;
    await expect(reserveCourseBuilderCredits({ ...input, db })).rejects.toMatchObject({
      code: 'INSUFFICIENT_CREDITS',
    });
  });
});
