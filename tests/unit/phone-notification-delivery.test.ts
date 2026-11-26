import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { deliverPhoneNotification, phoneNotificationKind } from '@/lib/phone/notification-delivery';
const identity = { taskId:'task',profileId:'recipient',kind:'voicemail' as const,channel:'email' as const };
function database(claim: any = { data:{id:'claim'},error:null }, save: any = { data:{id:'claim'},error:null }) {
  const writes: any[] = [];
  const db = { from: vi.fn(() => ({
    insert: () => ({ select: () => ({ single: async () => claim }) }),
    update: (row: any) => {
      writes.push(row);
      const q: any = { eq: () => q, select: () => q, single: async () => save,
        then: (resolve: any) => Promise.resolve({error:null}).then(resolve) };
      return q;
    },
  })) };
  return { db,writes };
}
describe('phone delivery evidence', () => {
  it('does not resend duplicate webhook attempts',async () => {
    const {db}=database({error:{code:'23505'}}); const send=vi.fn();
    expect(await deliverPhoneNotification(db,identity,send)).toBe('duplicate');
    expect(send).not.toHaveBeenCalled();
  });
  it('re-claims a claim whose send was definitively not accepted',async () => {
    const writes: any[] = []; const row = { id: 'claim-1' };
    const db = { from: vi.fn(() => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: '23505' } }) }) }),
      select: () => { const q: any = { eq: () => q, single: async () => ({ data: row, error: null }) }; return q; },
      update: (updateRow: any) => { writes.push(updateRow);
        const q: any = { eq: () => q, select: () => q, single: async () => ({ data: row, error: null }),
          then: (resolve: any) => Promise.resolve({ error: null }).then(resolve) };
        return q; },
    })) };
    const send = vi.fn(async () => ({ accepted: true, providerMessageId: 'retry-receipt' }));
    expect(await deliverPhoneNotification(db, identity, send)).toBe('accepted');
    expect(send).toHaveBeenCalledTimes(1);
    expect(writes[0]).toMatchObject({ status: 'processing' });
    expect(writes.at(-1)).toMatchObject({ status: 'accepted', provider_message_id: 'retry-receipt' });
  });
  it('never re-claims a claim held for acceptance reconciliation',async () => {
    const db = { from: vi.fn(() => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: '23505' } }) }) }),
      select: () => { const q: any = { eq: () => q, single: async () => ({ data: null, error: { code: 'PGRST116' } }) }; return q; },
      update: () => { throw new Error('must not update'); },
    })) };
    const send = vi.fn();
    expect(await deliverPhoneNotification(db, identity, send)).toBe('duplicate');
    expect(send).not.toHaveBeenCalled();
  });
  it('records a refused send as retryable, distinct from reconciliation',async () => {
    const {db,writes}=database();
    expect(await deliverPhoneNotification(db,identity,async()=>({accepted:false}))).toBe('review_required');
    expect(writes.at(-1)).toMatchObject({status:'review_required',outcome_code:'send_not_accepted'});
  });
  it('never sends if the durable claim fails',async () => {
    const {db}=database({error:{code:'unavailable'}}); const send=vi.fn();
    await expect(deliverPhoneNotification(db,identity,send)).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it('records provider acceptance with its actual message identifier',async () => {
    const {db,writes}=database();
    expect(await deliverPhoneNotification(db,identity,async()=>({accepted:true,providerMessageId:'provider-receipt'}))).toBe('accepted');
    expect(writes[0]).toMatchObject({status:'accepted',provider_message_id:'provider-receipt'});
    expect(writes[0].status).not.toBe('delivered');
  });
  it.each([false,true])('holds failed or unpersisted acceptance for review (%s)',async accepted=>{
    const {db,writes}=database(undefined,{error:{code:'unavailable'}});
    expect(await deliverPhoneNotification(db,identity,async()=>({accepted}))).toBe('review_required');
    expect(writes.at(-1)).toMatchObject({status:'review_required'});
  });
});

describe('voicemail notification identity',()=>{
 it('separates recording-only outages from a completed transcript',()=>{
  expect(phoneNotificationKind({source:'voicemail',awaitingTranscript:true})).toBe('voicemail_recording');
  expect(phoneNotificationKind({source:'voicemail',awaitingTranscript:true,transcript:'   '})).toBe('voicemail_recording');
  expect(phoneNotificationKind({source:'voicemail',awaitingTranscript:true,transcript:'Recovered'})).toBe('voicemail');
  expect(phoneNotificationKind({source:'voicemail',awaitingTranscript:false})).toBe('voicemail');
  expect(phoneNotificationKind({source:'paris',awaitingTranscript:true})).toBe('paris');
 });
});

