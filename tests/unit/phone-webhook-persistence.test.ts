import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ admin:vi.fn(), verify:vi.fn(), answer:vi.fn(), speak:vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient:mocks.admin }));
vi.mock('@/lib/phone/telnyx', () => ({
  verifyTelnyxWebhook:mocks.verify, telnyxClient:async () => ({ calls:{actions:{answer:mocks.answer,speak:mocks.speak}} }),
  decodeCallState:(value?: string) => value ? JSON.parse(value) : ({}), encodeCallState:JSON.stringify, publicPhoneNumber:() => 'unused',
}));
vi.mock('@/lib/email/sendgrid', () => ({sendEmail:vi.fn()}));
vi.mock('@/lib/notifications/sms', () => ({sendSMS:vi.fn()}));
vi.mock('@/lib/notifications/push-service', () => ({PushNotificationService:class {}}));
import { POST } from '@/apps/admin/app/api/webhooks/telnyx/route';
const event = { data: { id:'event',event_type:'call.initiated',occurred_at:'2026-10-10T00:00:00Z',
  payload:{call_control_id:'provider-call',direction:'incoming',to:'test-destination'} } };
const ok = (data: any) => ({ data,error:null });
function database(overrides: Record<string, any[]> = {}) {
  const answers: Record<string, any[]> = {
    phone_numbers:[ok({id:'number',phone_system_id:'system'})],
    phone_systems:[ok({id:'system'})], phone_calls:[ok(null),ok({id:'call'})],
    phone_call_events:[ok({id:'receipt'})], ...overrides,
  };
  const writes: any[] = [], filters: any[] = [];
  const db = { rpc:vi.fn().mockResolvedValue(ok([{ event_id:'receipt',claim_status:'claimed' }])),
    from:(table: string) => {
      const take = () => answers[table]?.shift() || ok(null);
      const q: any = { select:() => q,eq:(key: string,value: unknown) => { filters.push({table,key,value}); return q; },
        order:() => q,limit:() => q,neq:() => q,
        insert:(row: any) => { writes.push({table,row}); return q; },
        upsert:(row: any, options: any) => { writes.push({table,row,options}); return q; },
        update:(row: any) => { writes.push({table,row}); return q; },
        single:async () => take(), maybeSingle:async () => take(),
        then:(resolve: any,reject: any) => Promise.resolve(take()).then(resolve,reject) };
      return q;
    } };
  mocks.admin.mockResolvedValue(db);
  return { db,writes,filters };
}
beforeEach(() => { vi.clearAllMocks(); mocks.verify.mockResolvedValue(event); mocks.answer.mockResolvedValue({}); });
const request = () => new Request('https://example.invalid/api/webhooks/telnyx',{method:'POST',body:'signed body'});
describe('carrier webhook persistence boundary', () => {
  it('does not access the database for an invalid signature', async () => {
    mocks.verify.mockRejectedValue(new Error('bad signature'));
    expect((await POST(request())).status).toBe(401); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('reports a database outage instead of acknowledging an unknown number', async () => {
    const {db}=database({phone_numbers:[{data:null,error:{code:'unavailable'}}]});
    expect((await POST(request())).status).toBe(503); expect(db.rpc).not.toHaveBeenCalled();
  });
  it('requires call persistence before answering', async () => {
    const {writes}=database({phone_calls:[ok(null),{data:null,error:{code:'unavailable'}}]});
    expect((await POST(request())).status).toBe(503); expect(mocks.answer).not.toHaveBeenCalled();
    expect(writes.at(-1).row.processing_state).toBe('failed');
  });
  it('preserves ended calls when an initiation is retried', async () => {
    const {writes}=database({phone_calls:[ok({id:'call',phone_system_id:'system',provider:'telnyx',ended_at:'2026-10-10T00:00:10Z'})]});
    expect((await POST(request())).status).toBe(200); expect(mocks.answer).not.toHaveBeenCalled();
    expect(writes.every(w => w.table==='phone_call_events')).toBe(true);
  });
  it('retains event evidence on a provider failure with a stable retry command ID', async () => {
    const {writes}=database(); mocks.answer.mockRejectedValue(new Error('private provider response'));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.answer.mock.calls[0][1].command_id).toBe('event-answer');
    expect(writes.at(-1).row.processing_state).toBe('failed');
  });
  it('does not acknowledge processing before completion is stored', async () => {
    database({phone_call_events:[{data:null,error:{code:'unavailable'}}]});
    expect((await POST(request())).status).toBe(503);
  });
  it('does not acknowledge a lost call outcome write', async () => {
    mocks.verify.mockResolvedValue({ data:{...event.data,event_type:'call.hangup'} });
    const {writes}=database({phone_calls:[ok({id:'call',phone_system_id:'system'}),{data:null,error:{code:'unavailable'}}]});
    expect((await POST(request())).status).toBe(503);
    expect(writes.at(-1).row.processing_state).toBe('failed');
  });
  it('does not acknowledge a lost PARIS transcript', async () => {
    mocks.verify.mockResolvedValue({ data:{...event.data,event_type:'call.ai_gather.message_history_updated',
      payload:{...event.data.payload,client_state:JSON.stringify({taskId:'task'}),
        message_history:[{role:'user',content:'Authorized test request'}]}} });
    const {writes}=database({phone_calls:[ok({id:'call',phone_system_id:'system'})],
      phone_callback_tasks:[{data:null,error:{code:'unavailable'}}]});
    expect((await POST(request())).status).toBe(503);
    expect(writes.at(-1).row.processing_state).toBe('failed');
  });
  it.each(['call.initiated','call.answered','call.hangup'])('does not acknowledge a lost %s device-leg write', async type => {
    mocks.verify.mockResolvedValue({data:{...event.data,event_type:type,payload:{...event.data.payload,
      direction:'outgoing',client_state:JSON.stringify({phase:'webrtc_leg'})}}});
    const failed = {data:null,error:{code:'unavailable'}};
    const {writes}=database({phone_calls:[ok({id:'call',phone_system_id:'system'}),ok({id:'call'})],
      phone_call_legs:type==='call.hangup' ? [ok({id:'leg',answered_at:'2026-10-10T00:00:01Z'}),failed] : [failed]});
    expect((await POST(request())).status).toBe(503);
    expect(writes.at(-1).row.processing_state).toBe('failed');
  });
  it('does not start PARIS on an unknown device-leg outcome', async () => {
    mocks.verify.mockResolvedValue({data:{...event.data,event_type:'call.hangup',payload:{...event.data.payload,
      client_state:JSON.stringify({phase:'webrtc_leg',parentCallControlId:'parent'})}}});
    database({phone_calls:[ok({id:'call',phone_system_id:'system'})],
      phone_call_legs:[{data:null,error:{code:'unavailable'}},ok({id:'leg'})]});
    expect((await POST(request())).status).toBe(503);
    expect(mocks.speak).not.toHaveBeenCalled();
  });
  it('requires the recording callback to belong to the current call before saving its URL', async () => {
    mocks.verify.mockResolvedValue({data:{...event.data,event_type:'call.recording.saved',payload:{...event.data.payload,
      recording_urls:{mp3:'https://s3.amazonaws.com/telephony-recorder-prod/test.mp3'},
      client_state:JSON.stringify({taskId:'task',phase:'voicemail_recording'})}}});
    const {writes,filters}=database({phone_calls:[ok({id:'call',phone_system_id:'system'}),ok({id:'call'})],
      phone_callback_tasks:[ok(null),ok({id:'task'})]});
    expect((await POST(request())).status).toBe(503);
    expect(filters).toContainEqual({table:'phone_callback_tasks',key:'call_id',value:'call'});
    expect(writes.some(w => w.row.recording_url)).toBe(false);
  });
  it('does not acknowledge a recording after a zero-row call update', async () => {
    mocks.verify.mockResolvedValue({data:{...event.data,event_type:'call.recording.saved',payload:{...event.data.payload,
      recording_urls:{mp3:'https://s3.amazonaws.com/telephony-recorder-prod/test.mp3'}}}});
    const {writes}=database({phone_calls:[ok({id:'call',phone_system_id:'system'}),ok(null)]});
    expect((await POST(request())).status).toBe(503);
    expect(writes.at(-1).row.processing_state).toBe('failed');
  });
  it.each(['call.answered','call.hangup'])('completes a persisted %s device-leg outcome without a new fallback', async type => {
    mocks.verify.mockResolvedValue({data:{...event.data,event_type:type,payload:{...event.data.payload,
      client_state:JSON.stringify({phase:'webrtc_leg',parentCallControlId:'parent'})}}});
    const {writes,filters}=database({phone_calls:[ok({id:'call',phone_system_id:'system'}),ok({id:'call'})],
      phone_call_legs:type==='call.hangup' ? [ok({answered_at:'2026-10-10T00:00:01Z'}),ok({id:'leg'})] : [ok({id:'leg'})]});
    expect((await POST(request())).status).toBe(200);
    expect(filters).toContainEqual({table:'phone_call_legs',key:'call_id',value:'call'});
    expect(writes.at(-1).row.processing_state).toBe('completed');
    expect(mocks.speak).not.toHaveBeenCalled();
  });
  it('acknowledges a recording only after its scoped callback and call writes persist', async () => {
    mocks.verify.mockResolvedValue({data:{...event.data,event_type:'call.recording.saved',payload:{...event.data.payload,
      recording_urls:{mp3:'https://s3.amazonaws.com/telephony-recorder-prod/test.mp3'},
      client_state:JSON.stringify({taskId:'task',phase:'paris_intake'})}}});
    const {writes,filters}=database({phone_calls:[ok({id:'call',phone_system_id:'system'}),ok({id:'call'})],
      phone_callback_tasks:[ok({source:'paris'}),ok({id:'task'})]});
    expect((await POST(request())).status).toBe(200);
    expect(filters.filter(f => f.table==='phone_callback_tasks' && f.key==='call_id')).toHaveLength(2);
    expect(writes.filter(w => w.row.recording_url)).toHaveLength(2);
    expect(writes.at(-1).row.processing_state).toBe('completed');
  });
});
