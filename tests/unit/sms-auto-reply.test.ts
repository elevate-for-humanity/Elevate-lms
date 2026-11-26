import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    system: null as any,
    systemError: null as any,
    number: null as any,
    recent: [] as any[],
    inserted: [] as any[],
    updates: [] as Array<{ id: string; patch: Record<string, unknown> }>,
  };
  const send = vi.fn();
  const db = {
    from: (table: string) => {
      if (table === 'phone_systems') {
        const query: any = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () =>
            state.systemError
              ? { data: null, error: state.systemError }
              : { data: state.system, error: null },
        };
        return query;
      }
      if (table === 'phone_numbers') {
        const query: any = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () => ({ data: state.number, error: null }),
        };
        return query;
      }
      if (table === 'communication_sms_messages') {
        let mode = 'select';
        let patch: Record<string, unknown> | null = null;
        let insertedRow: Record<string, unknown> | null = null;
        const filters: Array<[string, unknown]> = [];
        const query: any = {
          select: () => query,
          eq: (field: string, value: unknown) => {
            filters.push([field, value]);
            return query;
          },
          gte: (field: string, value: unknown) => {
            filters.push([field, value]);
            return query;
          },
          limit: () => query,
          insert: (row: Record<string, unknown>) => {
            mode = 'insert';
            insertedRow = row;
            return query;
          },
          update: (value: Record<string, unknown>) => {
            mode = 'update';
            patch = value;
            return query;
          },
          single: async () => {
            if (mode === 'insert') {
              state.inserted.push(insertedRow);
              return { data: { id: 'auto-reply-row' }, error: null };
            }
            return { data: null, error: null };
          },
          then: (resolve: any) => {
            if (mode === 'select') {
              // Apply the created_at >= window-start filter the way the
              // database would, so window tests exercise the real boundary.
              const gte = filters.find(([field]) => field === 'created_at');
              const rows = gte
                ? state.recent.filter((row) => String(row.created_at) >= String(gte[1]))
                : state.recent;
              return Promise.resolve({ data: rows, error: null }).then(resolve);
            }
            if (mode === 'update') {
              const idFilter = filters.find(([field]) => field === 'id');
              state.updates.push({
                id: String(idFilter?.[1] ?? ''),
                patch: patch as Record<string, unknown>,
              });
              return Promise.resolve({ data: null, error: null }).then(resolve);
            }
            return Promise.resolve({ data: null, error: null }).then(resolve);
          },
        };
        return query;
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
  return { state, db, send };
});

vi.mock('@/lib/phone/twilio', () => ({ sendTwilioMessage: mocks.send }));

import {
  DEFAULT_SMS_AUTO_REPLY_MESSAGE,
  getSmsAutoReplySetting,
  looksLikeAutoReply,
  maybeSendSmsAutoReply,
} from '@/lib/phone/sms-auto-reply';
import { isSmsAutoReply } from '@/lib/phone/sms-threads';

const NOW = new Date('2026-11-25T18:00:00.000Z');
const CONFIGURED = 'Thanks for texting Elevate for Humanity! We will get back to you soon.';
const INPUT = {
  phoneSystemId: 'system-1',
  businessNumber: '+14632401404',
  senderNumber: '+13175550100',
  inboundBody: 'Hi, I want to sign up for classes.',
  inboundEventId: `twilio:SM${'a'.repeat(32)}`,
  ownerProfileId: 'profile-1',
  now: NOW,
};
const NUMBER = { provider: 'twilio', status: 'active', capabilities: { sms: true } };

beforeEach(() => {
  mocks.state.system = { sms_auto_reply_enabled: true, sms_auto_reply_message: CONFIGURED };
  mocks.state.systemError = null;
  mocks.state.number = NUMBER;
  mocks.state.recent = [];
  mocks.state.inserted = [];
  mocks.state.updates = [];
  mocks.send.mockReset();
  mocks.send.mockResolvedValue({ messageId: `SM${'b'.repeat(32)}` });
});

describe('maybeSendSmsAutoReply', () => {
  it('sends the configured reply once and records it as an auto-reply in the thread', async () => {
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result).toEqual({ sent: true, reason: 'sent', messageId: `SM${'b'.repeat(32)}` });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith({
      from: INPUT.businessNumber,
      to: INPUT.senderNumber,
      body: CONFIGURED,
    });
    expect(mocks.state.inserted).toHaveLength(1);
    expect(mocks.state.inserted[0]).toMatchObject({
      phone_system_id: 'system-1',
      owner_profile_id: 'profile-1',
      direction: 'outbound',
      from_number: INPUT.businessNumber,
      to_number: INPUT.senderNumber,
      body: CONFIGURED,
      status: 'pending',
      provider_event_id: `auto-reply:${INPUT.inboundEventId}`,
    });
    expect(mocks.state.updates).toEqual([
      {
        id: 'auto-reply-row',
        patch: { status: 'accepted', provider_message_id: `SM${'b'.repeat(32)}` },
      },
    ]);
  });

  it('sends nothing when the auto-reply is off', async () => {
    mocks.state.system = { sms_auto_reply_enabled: false, sms_auto_reply_message: CONFIGURED };
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result).toEqual({ sent: false, reason: 'disabled' });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.state.inserted).toHaveLength(0);
  });

  it('treats the setting as off while its columns do not exist yet', async () => {
    mocks.state.systemError = {
      message: 'column phone_systems.sms_auto_reply_enabled does not exist',
    };
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result).toEqual({ sent: false, reason: 'disabled' });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('falls back to the default message when none is configured', async () => {
    mocks.state.system = { sms_auto_reply_enabled: true, sms_auto_reply_message: '  ' };
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result.sent).toBe(true);
    expect(mocks.send).toHaveBeenCalledWith({
      from: INPUT.businessNumber,
      to: INPUT.senderNumber,
      body: DEFAULT_SMS_AUTO_REPLY_MESSAGE,
    });
  });

  it('does not reply a second time within the 24-hour window', async () => {
    mocks.state.recent = [
      {
        status: 'accepted',
        provider_event_id: 'auto-reply:twilio:SMolder',
        created_at: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
      },
    ];
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result).toEqual({ sent: false, reason: 'already-replied-in-window' });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.state.inserted).toHaveLength(0);
  });

  it('replies again once the previous auto-reply is older than 24 hours', async () => {
    mocks.state.recent = [
      {
        status: 'accepted',
        provider_event_id: 'auto-reply:twilio:SMolder',
        created_at: new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString(),
      },
    ];
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result.sent).toBe(true);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it('does not count a failed earlier attempt against the window', async () => {
    mocks.state.recent = [
      {
        status: 'failed',
        provider_event_id: 'auto-reply:twilio:SMolder',
        created_at: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
      },
    ];
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result.sent).toBe(true);
  });

  it('ignores ordinary outbound texts when checking the window', async () => {
    mocks.state.recent = [
      {
        status: 'accepted',
        provider_event_id: null,
        created_at: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
      },
    ];
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result.sent).toBe(true);
  });

  it('never replies to a message that is itself an auto-reply', async () => {
    const ownText = await maybeSendSmsAutoReply(mocks.db, { ...INPUT, inboundBody: CONFIGURED });
    expect(ownText).toEqual({ sent: false, reason: 'auto-reply-pattern' });
    const otherSystem = await maybeSendSmsAutoReply(mocks.db, {
      ...INPUT,
      inboundBody: 'This is an automated message. Do not reply.',
    });
    expect(otherSystem).toEqual({ sent: false, reason: 'auto-reply-pattern' });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('never replies to carrier keywords or to the business number itself', async () => {
    expect(await maybeSendSmsAutoReply(mocks.db, { ...INPUT, inboundBody: 'STOP' })).toEqual({
      sent: false,
      reason: 'keyword',
    });
    expect(
      await maybeSendSmsAutoReply(mocks.db, { ...INPUT, senderNumber: INPUT.businessNumber }),
    ).toEqual({ sent: false, reason: 'self' });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('does not send from a number that cannot text', async () => {
    mocks.state.number = { provider: 'twilio', status: 'active', capabilities: { sms: false } };
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result).toEqual({ sent: false, reason: 'number-not-sms-capable' });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('records a failed send and reports it instead of throwing', async () => {
    mocks.send.mockRejectedValue(new Error('Twilio did not confirm message acceptance.'));
    const result = await maybeSendSmsAutoReply(mocks.db, INPUT);
    expect(result).toEqual({ sent: false, reason: 'send-failed' });
    expect(mocks.state.updates).toEqual([
      {
        id: 'auto-reply-row',
        patch: {
          status: 'failed',
          error_message: expect.stringContaining('Auto-reply acceptance unconfirmed'),
        },
      },
    ]);
  });
});

describe('setting + loop-safety helpers', () => {
  it('reads the stored setting and defaults a blank message', async () => {
    mocks.state.system = { sms_auto_reply_enabled: true, sms_auto_reply_message: '' };
    await expect(getSmsAutoReplySetting(mocks.db, 'system-1')).resolves.toEqual({
      enabled: true,
      message: DEFAULT_SMS_AUTO_REPLY_MESSAGE,
    });
  });

  it('recognizes auto-reply text and leaves ordinary texts alone', () => {
    expect(looksLikeAutoReply(CONFIGURED, CONFIGURED)).toBe(true);
    expect(looksLikeAutoReply('Auto-reply: the office is closed.', CONFIGURED)).toBe(true);
    expect(looksLikeAutoReply('What time does the HVAC class start?', CONFIGURED)).toBe(false);
    expect(looksLikeAutoReply('', CONFIGURED)).toBe(false);
  });

  it('recognizes the thread marker on a recorded auto-reply', () => {
    expect(isSmsAutoReply({ id: '1', provider_event_id: 'auto-reply:twilio:SMx' })).toBe(true);
    expect(isSmsAutoReply({ id: '2', provider_event_id: 'twilio:SMx' })).toBe(false);
    expect(isSmsAutoReply({ id: '3', provider_event_id: null })).toBe(false);
  });
});
