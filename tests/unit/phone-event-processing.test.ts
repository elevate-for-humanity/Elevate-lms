import { describe, expect, it, vi } from 'vitest';
import { processTelnyxEvent } from '@/lib/phone/event-processing';
const event = { data: { id: 'event', event_type: 'call.hangup', occurred_at: '2026-10-10T00:00:00Z', payload: { call_control_id: 'call' } } };
const context = { system: { id: 'system' }, call: { id: 'call' } };
function database(status = 'claimed', save = { data: { id: 'receipt' }, error: null } as any) {
  const writes: any[] = [], filters: any[] = [];
  const db = {
    rpc: vi.fn().mockResolvedValue({ data: [{ event_id: 'receipt', claim_status: status }], error: null }),
    from: vi.fn(() => ({ update: (row: any) => {
      writes.push(row);
      const q: any = { eq: (key: string, value: string) => { filters.push([key,value]); return q; },
        select: () => q, single: async () => save };
      return q;
    } })),
  };
  return { db, writes, filters };
}
describe('durable carrier event processing', () => {
  it('does not execute a completed/legacy receipt again', async () => {
    const { db, writes } = database('duplicate'); const handle = vi.fn();
    expect(await processTelnyxEvent(db,event,context,handle)).toBe('duplicate');
    expect(handle).not.toHaveBeenCalled(); expect(writes).toEqual([]);
  });
  it.each(['busy','conflict','review_required'])('never executes a %s claim', async status => {
    const { db } = database(status); const handle = vi.fn();
    await expect(processTelnyxEvent(db,event,context,handle)).rejects.toThrow();
    expect(handle).not.toHaveBeenCalled();
  });
  it('never calls the provider without a durable claim', async () => {
    const { db } = database(); const handle = vi.fn();
    db.rpc.mockResolvedValue({ error: { code: 'unavailable' } } as any);
    await expect(processTelnyxEvent(db,event,context,handle)).rejects.toThrow();
    expect(handle).not.toHaveBeenCalled();
  });
  it('fences completion to this attempt and the retained event', async () => {
    const { db, writes, filters } = database();
    expect(await processTelnyxEvent(db,event,context,async () => {})).toBe('completed');
    expect(writes).toEqual([expect.objectContaining({ processing_state:'completed' })]);
    const token = db.rpc.mock.calls[0][1].p_token;
    expect(filters).toEqual([['id','receipt'],['processing_token',token],['processing_state','processing']]);
  });
  it('preserves a failed handler receipt and does not expose its error', async () => {
    const { db, writes } = database();
    await expect(processTelnyxEvent(db,event,context,async () => { throw new Error('private provider error'); }))
      .rejects.toThrow('Event handler failed');
    expect(writes).toEqual([expect.objectContaining({ processing_state:'failed',processing_outcome_code:'handler_failed' })]);
  });
  it('does not enable replay or report completion after an uncertain completion write', async () => {
    const { db, writes } = database('claimed', { data:null,error:{code:'unavailable'} });
    await expect(processTelnyxEvent(db,event,context,async () => {})).rejects.toThrow('Event outcome unavailable');
    expect(writes).toHaveLength(1); expect(writes[0].processing_state).toBe('completed');
  });
});
