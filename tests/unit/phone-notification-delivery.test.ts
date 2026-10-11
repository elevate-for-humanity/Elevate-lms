import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { deliverPhoneNotification } from '@/lib/phone/notification-delivery';
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
