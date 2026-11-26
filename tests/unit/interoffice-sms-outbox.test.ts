import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const rows: Array<{ id: string; phone: string; message: string }> = [];
  const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const selectFilters: Array<[string, unknown]> = [];
  const claimDenied = new Set<string>();
  const db = {
    from: (table: string) => {
      if (table !== 'interoffice_sms_outbox') throw new Error(`unexpected table ${table}`);
      let mode = 'select';
      let patch: Record<string, unknown> | null = null;
      let id = '';
      const query: any = {
        select: () => query,
        order: () => query,
        limit: () => query,
        eq: (field: string, value: unknown) => {
          if (mode === 'select') selectFilters.push([field, value]);
          if (field === 'id') id = String(value);
          return query;
        },
        update: (value: Record<string, unknown>) => {
          mode = 'update';
          patch = value;
          return query;
        },
        then: (resolve: any) => {
          if (mode === 'select') return Promise.resolve({ data: rows, error: null }).then(resolve);
          updates.push({ id, patch: patch as Record<string, unknown> });
          if ((patch as Record<string, unknown>).status === 'processing' && claimDenied.has(id))
            return Promise.resolve({ data: [], error: null }).then(resolve);
          if ((patch as Record<string, unknown>).status === 'processing')
            return Promise.resolve({ data: [{ id }], error: null }).then(resolve);
          return Promise.resolve({ data: null, error: null }).then(resolve);
        },
      };
      return query;
    },
  };
  return { rows, updates, selectFilters, claimDenied, db, send: vi.fn() };
});

vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/notifications/sms', () => ({ sendSMS: mocks.send }));

import { processInterofficeSmsOutbox } from '@/lib/notifications/interoffice-sms-outbox';

const ROW = { id: 'sms-1', phone: '+13175550101', message: 'Internal alert' };

beforeEach(() => {
  mocks.rows.length = 0;
  mocks.updates.length = 0;
  mocks.selectFilters.length = 0;
  mocks.claimDenied.clear();
  mocks.send.mockReset();
});

it('claims only pending rows and records provider acceptance', async () => {
  mocks.rows.push(ROW);
  mocks.send.mockResolvedValue({ success: true, messageId: 'SM123' });
  const result = await processInterofficeSmsOutbox();
  expect(mocks.selectFilters).toContainEqual(['status', 'pending']);
  expect(mocks.send).toHaveBeenCalledWith(ROW.phone, ROW.message);
  expect(mocks.updates.map((update) => update.patch.status)).toEqual(['processing', 'accepted']);
  expect(mocks.updates[1].patch).toMatchObject({ provider_message_id: 'SM123', error_message: null });
  expect(result).toEqual({ processed: 1, sent: 1, retried: 0, reviewRequired: 0 });
});

it('holds an unconfirmed send for review and never resends it', async () => {
  mocks.rows.push(ROW);
  mocks.send.mockResolvedValue({ success: false, error: 'SMS send outcome could not be confirmed' });
  const result = await processInterofficeSmsOutbox();
  expect(mocks.send).toHaveBeenCalledTimes(1);
  expect(mocks.updates.map((update) => update.patch.status)).toEqual(['processing', 'review_required']);
  expect(result).toEqual({ processed: 1, sent: 0, retried: 0, reviewRequired: 1 });
});

it('holds a definitively refused recipient for review', async () => {
  mocks.rows.push(ROW);
  mocks.send.mockResolvedValue({ success: false, error: 'Invalid phone number' });
  const result = await processInterofficeSmsOutbox();
  expect(mocks.updates.map((update) => update.patch.status)).toEqual(['processing', 'review_required']);
  expect(result.reviewRequired).toBe(1);
});

it('returns a provably unsent row to pending so a later run can claim it', async () => {
  mocks.rows.push(ROW);
  mocks.send.mockResolvedValue({
    success: false,
    error: 'SMS service unavailable — Twilio credentials or active business sender is missing.',
  });
  const result = await processInterofficeSmsOutbox();
  expect(mocks.updates.map((update) => update.patch.status)).toEqual(['processing', 'pending']);
  expect(mocks.updates[1].patch.error_message).toContain('SMS service unavailable');
  expect(result).toEqual({ processed: 1, sent: 0, retried: 1, reviewRequired: 0 });
});

it('does not send when another worker already claimed the row', async () => {
  mocks.rows.push(ROW);
  mocks.claimDenied.add(ROW.id);
  const result = await processInterofficeSmsOutbox();
  expect(mocks.send).not.toHaveBeenCalled();
  expect(result).toEqual({ processed: 1, sent: 0, retried: 0, reviewRequired: 0 });
});
