// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  event: {} as any,
  db: null as any,
  actions: {
    gatherUsingSpeak: vi.fn(), gatherUsingAI: vi.fn(), startRecording: vi.fn(),
    speak: vi.fn(), hangup: vi.fn(), answer: vi.fn(),
  },
  dial: vi.fn(),
  push: vi.fn(),
  email: vi.fn(),
  failVoicemailWrite: false,
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/resend', () => ({ resend: { emails: { send: mocks.email } } }));
vi.mock('@/lib/notifications/push-service', () => ({ PushNotificationService: class { sendToUserWithDatabase = mocks.push; } }));
vi.mock('@/lib/notifications/sms', () => ({ sendSMS: vi.fn() }));
vi.mock('@/lib/phone/telnyx', () => ({
  verifyTelnyxWebhook: async () => mocks.event,
  telnyxClient: () => ({ calls: { actions: mocks.actions, dial: mocks.dial } }),
  encodeCallState: (value: any) => Buffer.from(JSON.stringify(value)).toString('base64'),
  decodeCallState: (value: string) => JSON.parse(Buffer.from(value, 'base64').toString()),
  publicPhoneNumber: () => '+13179999620',
  menuPrompt: (greeting: string, options: any[]) => `${greeting} ${options.map(o => `Press ${o.digit} for ${o.label}.`).join(' ')}`,
}));

import { POST } from '@/apps/admin/app/api/webhooks/telnyx/route';

let tables: Record<string, any[]>;
const system = { id: 'system', greeting: 'Keep this exact greeting.', routing_mode: 'menu', admin_extension: '0', paris_intake_enabled: true, voicemail_enabled: true, timezone: 'America/Indiana/Indianapolis', ai_instructions: '', after_hours_message: 'Please leave a message.' };
function query(table: string) {
  let filters: Array<(row: any) => boolean> = [];
  let operation = 'select';
  let values: any;
  let one = false;
  const chain: any = {
    select: () => chain,
    eq: (key: string, value: any) => { filters.push(row => row[key] === value); return chain; },
    neq: (key: string, value: any) => { filters.push(row => row[key] !== value); return chain; },
    in: (key: string, values: any[]) => { filters.push(row => values.includes(row[key])); return chain; },
    gte: () => chain, order: () => chain, limit: () => chain,
    insert: (v: any) => { operation = 'insert'; values = v; return chain; },
    update: (v: any) => { operation = 'update'; values = v; return chain; },
    upsert: (v: any) => { operation = 'insert'; values = v; return chain; },
    delete: () => { operation = 'delete'; return chain; },
    maybeSingle: () => { one = true; return chain; },
    single: () => { one = true; return chain; },
    then: (resolve: any, reject: any) => {
      if (mocks.failVoicemailWrite && table === 'voicemails' && operation === 'insert') {
        return Promise.resolve({ data: null, error: new Error('voicemail write failed') }).then(resolve, reject);
      }
      const rows = tables[table] ||= [];
      let found = rows.filter(row => filters.every(f => f(row)));
      if (operation === 'update') found.forEach(row => Object.assign(row, values));
      if (operation === 'insert') { const added = { id: `new-${rows.length}`, ...values }; rows.push(added); found = [added]; }
      return Promise.resolve({ data: one ? found[0] || null : found, error: null }).then(resolve, reject);
    },
  };
  return chain;
}

async function event(type: string, payload: any = {}, state: any = {}, expectedStatus = 200) {
  mocks.event = { data: { id: `evt-${Math.random()}`, event_type: type, occurred_at: '2026-10-04T00:00:00Z', payload: {
    call_control_id: 'call-control', client_state: Buffer.from(JSON.stringify({systemId:'system',callId:'call',phase:'main_menu',...state})).toString('base64'), ...payload,
  } } };
  const response = await POST(new Request('https://admin.example/api/webhooks/telnyx', { method: 'POST', body: '{}' }));
  expect(response.status).toBe(expectedStatus);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.failVoicemailWrite = false;
  tables = {
    phone_systems: [{ ...system }], phone_calls: [{ id: 'call', provider: 'telnyx', provider_call_id: 'call-control', from_number: '+13175550100' }],
    communication_workspaces: [{ id: 'workspace', phone_system_id: 'system' }],
    communication_extensions: [
      { id: 'admin', workspace_id: 'workspace', extension: '0', display_name: 'Administrator', profile_id: 'admin-profile', enabled: true },
      { id: 'tech', workspace_id: 'workspace', extension: '101', display_name: 'Amiko Martin', department: 'Technology', profile_id: 'tech-profile', enabled: true },
      { id: 'beauty', workspace_id: 'workspace', extension: '105', display_name: 'Josanna George', department: 'Esthetician', profile_id: 'beauty-profile', enabled: true },
    ],
    phone_menu_options: [
      { phone_system_id: 'system', digit: 1, label: 'Technology', enabled: true, destination_id: 'tech-dest', spoken_keywords: ['technology', 'it'] },
      { phone_system_id: 'system', digit: 5, label: 'Esthetician', enabled: true, destination_id: 'beauty-dest', spoken_keywords: ['esthetician', 'beauty'] },
    ],
    phone_destinations: [
      { id: 'tech-dest', phone_system_id: 'system', extension_id: 'tech', enabled: true },
      { id: 'beauty-dest', phone_system_id: 'system', extension_id: 'beauty', enabled: true },
    ],
    phone_callback_tasks: [{ id: 'task', call_id: 'call', source: 'paris', extension_id: 'tech', assigned_profile_id: 'tech-profile' }],
    programs: [],
  };
  mocks.db = { from: query };
});

describe('Telnyx webhook recovery and routing (provider verification mocked)', () => {
  it('requests provider retry rather than acknowledging a voicemail that could not be saved', async () => {
    mocks.failVoicemailWrite = true;
    await event('call.recording.saved', { recording_urls: { mp3: 'https://recordings.example/message.mp3' } }, {
      phase: 'voicemail_recording', taskId: 'task', extensionId: 'beauty', profileId: 'beauty-profile',
    }, 500);
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('copies voicemail notification to Admin without transferring the call or changing its holder', async () => {
    tables.profiles = [{ id: 'admin-profile', email: 'admin@example.test' }, { id: 'beauty-profile', email: 'holder@example.test' }];
    Object.assign(tables.phone_callback_tasks[0], { source: 'voicemail', extension_id: 'beauty', assigned_profile_id: 'beauty-profile' });
    await event('call.recording.saved', { recording_urls: { mp3: 'https://recordings.example/message.mp3' } }, {
      phase: 'voicemail_recording', taskId: 'task', extensionId: 'beauty', profileId: 'beauty-profile',
    });
    expect(tables.voicemails).toHaveLength(1);
    expect(tables.voicemails[0]).toMatchObject({ call_id: 'call', assigned_profile_id: 'beauty-profile' });
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('beauty-profile');
    expect(mocks.push.mock.calls.map(c => c[1])).toEqual(expect.arrayContaining(['beauty-profile', 'admin-profile']));
    expect(mocks.email.mock.calls.map(c => c[0].to)).toEqual(expect.arrayContaining(['holder@example.test', 'admin@example.test']));
    expect(mocks.email.mock.calls.find(c => c[0].to === 'admin@example.test')?.[0].text).toContain('/phone/inbox');
    expect(mocks.dial).not.toHaveBeenCalled();
  });
  it('does not duplicate the voicemail row when recording delivery is repeated', async () => {
    for (let i = 0; i < 2; i++) await event('call.recording.saved', { recording_urls: { mp3: 'https://recordings.example/message.mp3' } }, {
      phase: 'voicemail_recording', taskId: 'task', extensionId: 'beauty', profileId: 'beauty-profile',
    });
    expect(tables.voicemails).toHaveLength(1);
  });
  it('notifies Admin only once when Admin is already the assigned recipient', async () => {
    Object.assign(tables.phone_callback_tasks[0], { source: 'voicemail', extension_id: 'admin', assigned_profile_id: 'admin-profile' });
    await event('call.recording.saved', { recording_urls: { mp3: 'https://recordings.example/message.mp3' } }, {
      phase: 'voicemail_recording', taskId: 'task', extensionId: 'admin', profileId: 'admin-profile',
    });
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push.mock.calls[0][2].url).toContain('admin.elevateforhumanity.org/phone/inbox');
  });
  it('recognizes the observed voicemail_prompt recording event using its persisted callback source', async () => {
    Object.assign(tables.phone_callback_tasks[0], { source: 'voicemail', extension_id: 'beauty', assigned_profile_id: 'beauty-profile' });
    await event('call.recording.saved', { recording_urls: { mp3: 'https://recordings.example/message.mp3' } }, {
      phase: 'voicemail_prompt', taskId: 'task', extensionId: 'tech', profileId: 'tech-profile',
    });
    expect(tables.voicemails[0]).toMatchObject({ call_id: 'call', assigned_profile_id: 'beauty-profile' });
    expect(mocks.push.mock.calls.map(c => c[1])).toEqual(expect.arrayContaining(['beauty-profile', 'admin-profile']));
  });
  it('keeps an unanswered holder call with PARIS rather than dialing Admin', async () => {
    tables.phone_call_legs = [{ provider_call_id: 'holder-leg', answered_at: null }];
    await event('call.hangup', { call_control_id: 'holder-leg', hangup_cause: 'timeout' }, {
      phase: 'webrtc_leg', parentCallControlId: 'call-control', extensionId: 'beauty', profileId: 'beauty-profile',
    });
    expect(mocks.dial).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingAI).toHaveBeenCalled();
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('beauty-profile');
  });
  it('does not hang up after the observed voice-provider timeout', async () => {
    await event('call.ai_gather.ended', { status: 'client_error', result: null }, { phase: 'paris_intake', taskId: 'task', extensionId: 'tech', profileId: 'tech-profile' });
    expect(mocks.actions.hangup).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingSpeak).toHaveBeenCalled();
    expect(tables.phone_callback_tasks[0].summary).toBeUndefined();
  });
  it('preserves the greeting while making menu keys immediate', async () => {
    await event('call.answered');
    const config = mocks.actions.gatherUsingSpeak.mock.calls[0][1];
    expect(config.payload.startsWith(system.greeting)).toBe(true);
    expect(config.maximum_digits).toBe(1);
    expect(config.payload).toContain('star');
  });
  it('accepts one-key directory choices and contains the correct departments', async () => {
    await event('call.gather.ended', { digits: '8', status: 'valid' });
    const config = mocks.actions.gatherUsingSpeak.mock.calls[0][1];
    expect(config.minimum_digits).toBe(1);
    expect(config.maximum_digits).toBe(1);
    expect(config.payload).toContain('Josanna George');
    expect(config.payload).toContain('Esthetician');
  });
  it('does not reinterpret empty invalid input as administrator option zero', async () => {
    await event('call.gather.ended', { digits: '', status: 'invalid' });
    expect(mocks.dial).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingAI).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingSpeak).toHaveBeenCalled();
  });
  it('collects the full extension after star without routing the first digit', async () => {
    await event('call.gather.ended', { digits: '*', status: 'valid' });
    const config = mocks.actions.gatherUsingSpeak.mock.calls[0][1];
    expect(config.minimum_digits).toBe(3);
    expect(config.maximum_digits).toBe(3);
    expect(mocks.dial).not.toHaveBeenCalled();
  });
  it('reassigns an esthetician callback from technology to the configured beauty extension', async () => {
    await event('call.ai_gather.ended', { status: 'valid', result: { program_interest: 'esthetician', caller_name: 'Test caller', conversation_complete: true } }, { phase: 'paris_intake', taskId: 'task', extensionId: 'tech', profileId: 'tech-profile' });
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('beauty-profile');
    expect(tables.phone_callback_tasks[0].extension_id).toBe('beauty');
    expect(mocks.actions.hangup).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingSpeak).toHaveBeenCalled();
  });
  it('keeps a technology callback with technology', async () => {
    await event('call.ai_gather.ended', { status: 'valid', result: { program_interest: 'technology', conversation_complete: true } }, { phase: 'paris_intake', taskId: 'task', extensionId: 'tech', profileId: 'tech-profile' });
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('tech-profile');
  });
  it('routes full extension 105 to its assigned owner when unavailable', async () => {
    for (const [digits, phase] of [['105', 'extension_menu']]) {
      mocks.actions.gatherUsingAI.mockClear();
      await event('call.gather.ended', { digits, status: 'valid' }, { phase });
      const config = mocks.actions.gatherUsingAI.mock.calls[0][1];
      const state = JSON.parse(Buffer.from(config.client_state, 'base64').toString());
      expect(state.extensionId).toBe('beauty');
      expect(state.profileId).toBe('beauty-profile');
      expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('beauty-profile');
      expect(tables.phone_calls[0].assigned_profile_id).toBe('beauty-profile');
      expect(config.user_response_timeout_ms).toBeGreaterThanOrEqual(30000);
    }
  });
  it('does not route an incomplete extension 1 to the technology menu option', async () => {
    await event('call.gather.ended', { digits: '1', status: 'invalid' }, { phase: 'extension_menu' });
    expect(mocks.actions.gatherUsingAI).not.toHaveBeenCalled();
    expect(mocks.dial).not.toHaveBeenCalled();
  });
  it('continues through every directory page and retries a failed page with another voice', async () => {
    tables.communication_extensions.push(...Array.from({ length: 22 }, (_, i) => ({
      id: `extra${i}`, workspace_id: 'workspace', extension: String(200+i), display_name: `Partner ${i}`,
      department: 'Partner services', enabled: true,
    })));
    await event('call.gather.ended', { digits: '8', status: 'valid' });
    let config = mocks.actions.gatherUsingSpeak.mock.lastCall![1];
    let state = JSON.parse(Buffer.from(config.client_state, 'base64').toString());
    await event('call.gather.ended', { digits: '', status: 'client_error' }, state);
    const retry = mocks.actions.gatherUsingSpeak.mock.lastCall![1];
    expect(retry.payload).toBe(config.payload);
    expect(retry.voice).not.toBe(config.voice);
    let spoken = '';
    for (let count = 0; count < 20; count++) {
      config = mocks.actions.gatherUsingSpeak.mock.lastCall![1];
      spoken += config.payload;
      state = JSON.parse(Buffer.from(config.client_state, 'base64').toString());
      if (state.directoryMore !== 'true') break;
      await event('call.gather.ended', { digits: '', status: 'timeout' }, state);
    }
    expect(spoken).toContain('Partner 21');
    expect(spoken).toContain('End of directory');
    expect(mocks.actions.gatherUsingAI).not.toHaveBeenCalled();
  });
  it('advances on the actual no-input invalid event and reads Gary, Texas and every enabled holder', async () => {
    tables.communication_extensions.push(...Array.from({ length: 12 }, (_, i) => ({
      id: `staff${i}`, workspace_id: 'workspace', extension: String(110+i), display_name: `Staff ${i}`,
      department: 'Program services', profile_id: `profile${i}`, enabled: true,
    })),
      { id: 'gary1', workspace_id: 'workspace', extension: '206', display_name: 'Matthew Barnes', department: 'Gary Site Coordinator', enabled: true },
      { id: 'gary2', workspace_id: 'workspace', extension: '208', display_name: 'Tempestt Barnes', department: 'Gary Site Coordinator', enabled: true },
      { id: 'texas', workspace_id: 'workspace', extension: '209', display_name: 'Amir Naseen', department: 'Texas State Site Coordinator', enabled: true },
      { id: 'inactive', workspace_id: 'workspace', extension: '205', display_name: 'Inactive holder', enabled: false },
    );
    await event('call.gather.ended', { digits: '8', status: 'valid' });
    let speech = '';
    const pages = new Set();
    for (let count = 0; count < 20; count++) {
      const config = mocks.actions.gatherUsingSpeak.mock.lastCall![1];
      const state = JSON.parse(Buffer.from(config.client_state, 'base64').toString());
      expect(pages.has(state.directoryPage)).toBe(false);
      pages.add(state.directoryPage);
      speech += config.payload;
      if (state.directoryMore !== 'true') break;
      await event('call.gather.ended', { digits: '', status: 'invalid' }, state);
    }
    for (const e of tables.communication_extensions.filter(e => e.enabled)) expect(speech).toContain(e.display_name);
    expect(speech).toContain('End of directory');
    expect(speech).not.toContain('Inactive holder');
    expect(speech).not.toMatch(/or press \d/i);
  });
  it.each([
    ['206', 'Matthew Barnes'], ['208', 'Tempestt Barnes'], ['209', 'Amir Naseen'], ['207', 'Tanesha Anderson'],
  ])('routes extension %s to its coordinator or holder without requiring a menu option', async (extension, name) => {
    tables.communication_extensions.push({ id: 'requested-staff', workspace_id: 'workspace', extension,
      display_name: name, profile_id: 'requested-profile', enabled: true });
    await event('call.gather.ended', { digits: extension, status: 'valid' }, { phase: 'extension_menu' });
    expect(tables.phone_calls[0].assigned_profile_id).toBe('requested-profile');
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('requested-profile');
    expect(mocks.actions.hangup).not.toHaveBeenCalled();
  });
  it('does not route a retired single-digit holder shortcut', async () => {
    await event('call.gather.ended', { digits: '5', status: 'valid' });
    expect(mocks.actions.gatherUsingAI).not.toHaveBeenCalled();
    expect(mocks.dial).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingSpeak).toHaveBeenCalled();
  });
  it('only hangs up after an explicit finished choice and completed goodbye', async () => {
    await event('call.gather.ended', { digits: '2', status: 'valid' }, { phase: 'paris_followup', taskId: 'task' });
    expect(mocks.actions.hangup).not.toHaveBeenCalled();
    const spoken = mocks.actions.speak.mock.lastCall![1];
    const state = JSON.parse(Buffer.from(spoken.client_state, 'base64').toString());
    await event('call.speak.ended', {}, state);
    expect(mocks.actions.hangup).toHaveBeenCalledTimes(1);
  });
  it('uses saved conversation history when the caller resumes', async () => {
    tables.phone_call_events = [{call_id:'call',event_type:'call.ai_gather.message_history_updated',payload:{message_history:[{role:'user',content:'I have a question about esthetician training.'}]}}];
    await event('call.gather.ended', { digits: '1', status: 'valid' }, { phase: 'paris_recovery', taskId: 'task', extensionId: 'beauty', profileId: 'beauty-profile' });
    const config = mocks.actions.gatherUsingAI.mock.lastCall![1];
    expect(config.message_history[0].content).toContain('esthetician');
    expect(config.greeting).toContain('Please continue');
    expect(mocks.actions.startRecording).not.toHaveBeenCalled();
  });
  it('assigns the program callback before the interview finishes or the caller disconnects', async () => {
    await event('call.ai_gather.partial_results', { partial_results: { program_interest: 'esthetician' } }, { phase: 'paris_intake', taskId: 'task', extensionId: 'tech', profileId: 'tech-profile' });
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('beauty-profile');
    await event('call.ai_gather.ended', { status: 'client_error', result: null }, { phase: 'paris_intake', taskId: 'task', extensionId: 'tech', profileId: 'tech-profile' });
    const recovery = mocks.actions.gatherUsingSpeak.mock.lastCall![1];
    expect(JSON.parse(Buffer.from(recovery.client_state, 'base64').toString()).profileId).toBe('beauty-profile');
    expect(mocks.actions.hangup).not.toHaveBeenCalled();
  });
  it('does not restart a cancelled gather or a call that already ended', async () => {
    await event('call.gather.ended', { status: 'cancelled' });
    tables.phone_calls[0].ended_at = '2026-10-04T00:00:00Z';
    await event('call.ai_gather.ended', { status: 'invalid' }, { taskId: 'task', phase: 'paris_intake' });
    expect(mocks.actions.gatherUsingSpeak).not.toHaveBeenCalled();
    expect(mocks.actions.gatherUsingAI).not.toHaveBeenCalled();
  });
  it('uses current holder assignments as well as department keywords', async () => {
    tables.program_holders = [{ id: 'holder', user_id: 'beauty-profile', status: 'active' }];
    tables.program_holder_programs = [{ program_holder_id: 'holder', program_slug: 'skin-care-apprenticeship', status: 'active' }];
    await event('call.ai_gather.ended', { status: 'valid', result: { program_interest: 'skin care apprenticeship', conversation_complete: false } }, { phase:'paris_intake',taskId:'task',extensionId:'tech',profileId:'tech-profile' });
    expect(tables.phone_callback_tasks[0].assigned_profile_id).toBe('beauty-profile');
    expect(mocks.actions.hangup).not.toHaveBeenCalled();
  });
});
