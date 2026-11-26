import { describe, expect, it } from 'vitest';
import {
  groupSmsThreads,
  smsCounterpartyKey,
  smsThreadPreview,
  type SmsMessageLike,
} from '@/lib/phone/sms-threads';

function message(partial: Partial<SmsMessageLike>): SmsMessageLike {
  return {
    id: Math.random().toString(36).slice(2),
    direction: 'inbound',
    from_number: '+13175550123',
    to_number: '+14632401404',
    body: 'Hello',
    status: 'delivered',
    created_at: '2026-11-25T15:00:00.000Z',
    ...partial,
  };
}

describe('SMS conversation threading', () => {
  it('keys inbound messages by sender and outbound messages by recipient', () => {
    expect(smsCounterpartyKey(message({ direction: 'inbound', from_number: '+13175550123' }))).toBe(
      '+13175550123',
    );
    expect(
      smsCounterpartyKey(message({ direction: 'outbound', to_number: '+13175550123' })),
    ).toBe('+13175550123');
    expect(smsCounterpartyKey(message({ direction: 'inbound', from_number: '' }))).toBeNull();
    expect(smsCounterpartyKey(message({ direction: 'outbound', to_number: null }))).toBeNull();
  });

  it('merges the same person across number formats into one thread', () => {
    const threads = groupSmsThreads([
      message({ id: 'a', direction: 'inbound', from_number: '+13175550123', created_at: '2026-11-25T15:00:00.000Z' }),
      message({ id: 'b', direction: 'outbound', to_number: '(317) 555-0123', created_at: '2026-11-25T15:01:00.000Z' }),
      message({ id: 'c', direction: 'inbound', from_number: '3175550123', created_at: '2026-11-25T15:02:00.000Z' }),
    ]);
    expect(threads).toHaveLength(1);
    expect(threads[0].key).toBe('+13175550123');
    expect(threads[0].displayName).toBe('(317) 555-0123');
    expect(threads[0].messages.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(threads[0].inboundCount).toBe(2);
    expect(threads[0].outboundCount).toBe(1);
  });

  it('separates counterparties and orders threads by latest activity', () => {
    const threads = groupSmsThreads([
      message({ id: 'old', from_number: '+13175550123', created_at: '2026-11-24T15:00:00.000Z' }),
      message({ id: 'new', from_number: '+12125550199', created_at: '2026-11-25T15:00:00.000Z' }),
    ]);
    expect(threads).toHaveLength(2);
    expect(threads[0].lastMessage.id).toBe('new');
    expect(threads[1].lastMessage.id).toBe('old');
    expect(threads[0].lastActivityAt).toBe('2026-11-25T15:00:00.000Z');
  });

  it('skips messages with no counterparty number', () => {
    const threads = groupSmsThreads([
      message({ id: 'kept', from_number: '+13175550123' }),
      message({ id: 'skipped', direction: 'inbound', from_number: '' }),
    ]);
    expect(threads).toHaveLength(1);
    expect(threads[0].messages.map((item) => item.id)).toEqual(['kept']);
  });

  it('previews body text, then picture-only messages', () => {
    expect(smsThreadPreview(message({ body: '  See you at 9  ' }))).toBe('See you at 9');
    expect(smsThreadPreview(message({ body: '', media: [{ url: 'x' }] }))).toBe('Picture message');
    expect(smsThreadPreview(message({ body: '', media: [] }))).toBe('');
  });
});
