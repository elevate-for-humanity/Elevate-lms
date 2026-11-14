import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BILLING_SERVICES,
  billingSignals,
  easternDate,
  validateServiceBilling,
  type ServiceBillingRecord,
} from '@/lib/admin/service-billing-policy';
const push = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const secrets = vi.hoisted(() => vi.fn());
vi.mock('@/lib/secrets', () => ({ getSelectedRuntimeSecrets: secrets }));
vi.mock('@/lib/notifications/push-service', () => ({
  getPushNotificationService: () => ({ sendToUserWithDatabase: push }),
}));
import {
  readServiceBilling,
  saveServiceBilling,
  refreshServiceBillingAlerts,
  refreshConnectedBalances,
} from '@/lib/admin/service-billing';
const now = Date.parse('2026-11-14T07:00:00Z');
const record = (patch = {}): ServiceBillingRecord => ({
  serviceId: 'twilio',
  revision: 'r1',
  enabled: true,
  currency: 'USD',
  balance: 50,
  warningBalance: 20,
  criticalBalance: 5,
  amountDue: null,
  dueDate: null,
  paymentStatus: 'unknown',
  warningDays: 7,
  observedAt: new Date(now).toISOString(),
  source: 'manual',
  reference: '',
  notes: '',
  ...patch,
});

/** Emulates database unique inserts and compare-and-set, not provider success. */
function database(initial: ServiceBillingRecord[] = []) {
  const settings = new Map(
    initial.map((r) => ['service_billing:' + r.serviceId, JSON.stringify(r)]),
  );
  const notices = new Map<string, any>();
  const db: any = {
    async rpc(name: string, args: any) {
      if (name === 'service_billing_admin_recipients') return { data: [{ id: 'admin1' }] };
      if (name === 'claim_service_billing_push') {
        const row = [...notices.values()].find(
          (n) => n.id === args.p_id && n.user_id === args.p_user_id,
        );
        const current = JSON.parse(settings.get('service_billing:' + args.p_service_id)!);
        if (
          !row ||
          current.revision !== args.p_expected_revision ||
          row.metadata.billing_revision !== args.p_expected_revision ||
          row.metadata.push_status !== 'pending' ||
          row.metadata.resolved_at
        )
          return { data: false };
        row.metadata.push_status = 'attempting';
        return { data: true };
      }
      if (name === 'record_service_billing_push_receipt') {
        const row = [...notices.values()].find(
          (n) => n.id === args.p_id && n.user_id === args.p_user_id,
        );
        if (row) {
          row.metadata = {
            ...row.metadata,
            push_status: args.p_status,
            accepted_devices: args.p_devices,
            push_attempted_at: args.p_now,
            ...(args.p_status === 'superseded'
              ? { resolved_at: row.metadata.resolved_at || args.p_now }
              : {}),
          };
          if (args.p_status === 'superseded') row.read = true;
        }
        return {};
      }
      await db.beforeReconcile?.();
      const current = JSON.parse(settings.get('service_billing:' + args.p_service_id)!);
      if (current.revision !== args.p_expected_revision)
        return { error: { message: 'SERVICE_BILLING_CONFLICT' } };
      const inserted: any[] = [];
      const prepared = args.p_notices.map((n: any) => {
        const prior = [...notices.values()]
          .reverse()
          .find((old) => (old.metadata.base_key || old.idempotency_key) === n.idempotency_key);
        return {
          ...n,
          idempotency_key: prior
            ? prior.metadata.resolved_at
              ? n.idempotency_key + ':after:' + prior.id
              : prior.idempotency_key
            : n.idempotency_key,
          metadata: {
            ...n.metadata,
            base_key: n.idempotency_key,
            billing_revision: args.p_expected_revision,
          },
        };
      });
      for (const row of notices.values())
        if (
          row.metadata.service_id === args.p_service_id &&
          !row.metadata.resolved_at &&
          !prepared.some((n: any) => n.idempotency_key === row.idempotency_key)
        ) {
          row.read = true;
          row.metadata = { ...row.metadata, resolved_at: args.p_now };
        }
      for (const n of prepared)
        if (!notices.has(n.idempotency_key)) {
          const row = { ...n, id: 'notice' + notices.size };
          notices.set(n.idempotency_key, row);
          inserted.push(row);
        } else {
          const old = notices.get(n.idempotency_key);
          if (old.metadata.push_status === 'pending' && !old.metadata.resolved_at) {
            old.title = n.title;
            old.message = n.message;
            old.metadata = {
              ...old.metadata,
              billing_revision: args.p_expected_revision,
              observed_at: n.metadata.observed_at,
            };
          }
        }
      return {
        data: [
          ...inserted.map((n) => ({ ...n, newly_created: true })),
          ...prepared.flatMap((n: any) => {
            const old = notices.get(n.idempotency_key);
            return !inserted.includes(old) &&
              old?.metadata.push_status === 'pending' &&
              !old.metadata.resolved_at
              ? [{ ...old, newly_created: false }]
              : [];
          }),
        ],
      };
    },
    from(table: string) {
      const filters: Record<string, any> = {};
      let operation = 'read';
      let payload: any;
      let duplicates = false;
      const q: any = {
        eq(key: string, value: any) {
          filters[key] = value;
          return q;
        },
        in() {
          return q;
        },
        or() {
          return q;
        },
        like() {
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        update(value: any) {
          operation = 'update';
          payload = value;
          return q;
        },
        upsert(value: any, options: any) {
          operation = 'upsert';
          payload = value;
          duplicates = options.ignoreDuplicates;
          return q;
        },
        select() {
          return q;
        },
        maybeSingle: async () => ({
          data: settings.has(filters.key) ? { value: settings.get(filters.key) } : null,
        }),
        then(resolve: any, reject: any) {
          return Promise.resolve()
            .then(() => {
              if (table === 'profiles') return { data: [{ id: 'admin1' }] };
              if (table === 'app_settings') {
                if (operation === 'read' && db.failNextRead) {
                  db.failNextRead = false;
                  throw Error('temporary read failure');
                }
                if (operation === 'read')
                  return { data: [...settings].map(([key, value]) => ({ key, value })) };
                const key = filters.key || payload.key;
                if (operation === 'update' && settings.get(key) !== filters.value)
                  return { data: [] };
                if (operation === 'upsert' && duplicates && settings.has(key)) return { data: [] };
                settings.set(key, payload.value);
                return { data: [{ key }] };
              }
              if (operation === 'upsert') {
                const inserted: any[] = [];
                for (const n of payload)
                  if (!notices.has(n.idempotency_key)) {
                    const row = { ...n, id: 'notice' + notices.size };
                    notices.set(n.idempotency_key, row);
                    inserted.push(row);
                  }
                return { data: inserted };
              }
              if (table === 'notifications' && operation === 'read')
                return { data: [...notices.values()].reverse() };
              if (table === 'notifications' && operation === 'update') {
                for (const row of notices.values())
                  if (row.id === filters.id) Object.assign(row, payload);
              }
              return { data: [] };
            })
            .then(resolve, reject);
        },
      };
      return q;
    },
  };
  return { db, settings, notices };
}
describe('service billing evidence and alerts', () => {
  beforeEach(() => push.mockClear());
  it('keeps zero and negative balances distinct from missing evidence', () => {
    expect(
      billingSignals(record({ balance: 0 }), now).some((s) => s.kind === 'balance-critical'),
    ).toBe(true);
    expect(
      billingSignals(record({ balance: -0.12 }), now).some((s) => s.kind === 'balance-critical'),
    ).toBe(true);
    expect(billingSignals(record({ balance: null }), now).map((s) => s.kind)).toEqual([
      'verification-needed',
    ]);
  });
  it('does not treat a paid top-up receipt as a verified remaining wallet balance', () => {
    expect(
      billingSignals(record({ balance: null, paymentStatus: 'paid' }), now).map((s) => s.kind),
    ).toEqual(['verification-needed']);
    expect(
      billingSignals(record({ balance: 2, paymentStatus: 'paid' }), now).some(
        (s) => s.kind === 'balance-critical',
      ),
    ).toBe(true);
  });
  it('uses Eastern calendar days across the UTC midnight boundary', () => {
    const utc = Date.parse('2026-11-14T02:00:00Z');
    expect(easternDate(utc)).toBe('2026-11-13');
    expect(
      billingSignals(record({ paymentStatus: 'due', dueDate: '2026-11-14' }), utc).find(
        (s) => s.kind === 'due-now',
      )?.message,
    ).toContain('in 1 day');
  });
  it('escalates a due invoice, then clears its due warning only when paid', () => {
    const due = record({ paymentStatus: 'due', dueDate: '2026-11-13', amountDue: 65.96 });
    expect(billingSignals(due, now).find((s) => s.kind === 'overdue')?.severity).toBe('critical');
    expect(
      billingSignals({ ...due, paymentStatus: 'paid' }, now).some((s) => s.kind === 'overdue'),
    ).toBe(false);
    expect(
      billingSignals({ ...due, paymentStatus: 'failed' }, now).some(
        (s) => s.kind === 'payment-failed',
      ),
    ).toBe(true);
  });
  it('flags stale evidence instead of certifying an old positive balance', () => {
    expect(billingSignals(record(), now + 86400001).map((s) => s.kind)).toEqual([
      'verification-needed',
    ]);
    expect(billingSignals(record({ enabled: false }), now + 86400001)).toEqual([]);
  });
  it.each([
    { balance: NaN },
    { amountDue: -1 },
    { warningBalance: 1, criticalBalance: 5 },
    { dueDate: '2026-02-31' },
    { observedAt: '2028-01-01' },
    { currency: 'CAD' },
    { notes: 'https://private.example/token' },
    { reference: '<script>' },
  ])('rejects invalid billing values %j', (patch) => {
    expect(() => validateServiceBilling(record(patch), now)).toThrow('SERVICE_BILLING_INVALID');
  });
  it('allows only predefined HTTPS destinations and drops supplied URL/credential fields', () => {
    expect(
      BILLING_SERVICES.every(
        (s) => new URL(s.url).protocol === 'https:' && !new URL(s.url).username,
      ),
    ).toBe(true);
    const value = validateServiceBilling(
      { ...record(), billingUrl: 'javascript:bad', apiKey: 'secret' },
      now,
    );
    expect(value).not.toHaveProperty('billingUrl');
    expect(value).not.toHaveProperty('apiKey');
  });
  it('accepts normal multiline notes but still rejects other control characters', () => {
    expect(
      validateServiceBilling(
        record({ notes: 'Invoice received\nCheck account\r\nNo card data' }),
        now,
      ).notes,
    ).toBe('Invoice received Check account No card data');
    expect(() => validateServiceBilling(record({ notes: 'bad\0data' }), now)).toThrow(
      'SERVICE_BILLING_INVALID',
    );
  });
  it('rejects a stale open form and preserves the newer payment record', async () => {
    const { db, settings } = database([record()]);
    await expect(saveServiceBilling(db, record({ balance: 0 }), 'old')).rejects.toThrow(
      'SERVICE_BILLING_CONFLICT',
    );
    expect(JSON.parse(settings.get('service_billing:twilio')!).balance).toBe(50);
    const result = await saveServiceBilling(db, record({ paymentStatus: 'paid' }), 'r1');
    expect(result.revision).not.toBe('r1');
    expect((await readServiceBilling(db))[0]?.paymentStatus).toBe('paid');
  });
  it('deduplicates concurrent polls and pushes only each newly inserted warning', async () => {
    const { db, notices } = database([record({ balance: 0 })]);
    const results = await Promise.all([
      refreshServiceBillingAlerts(db, now),
      refreshServiceBillingAlerts(db, now),
    ]);
    expect(results.reduce((n, r) => n + r.created, 0)).toBe(1);
    expect(notices.size).toBe(1);
    expect(push).toHaveBeenCalledTimes(1);
  });
  it('resolves paid notices and rearms only after a verified recovery', async () => {
    const { db, settings, notices } = database([record({ balance: 0 })]);
    await refreshServiceBillingAlerts(db, now);
    const original = [...notices.values()][0];
    // Reading a warning must not cause another push while the condition persists.
    original.read = true;
    await refreshServiceBillingAlerts(db, now);
    expect(push).toHaveBeenCalledTimes(1);
    settings.set('service_billing:twilio', JSON.stringify(record({ balance: 50 })));
    await refreshServiceBillingAlerts(db, now);
    expect(original.metadata.resolved_at).toBe(new Date(now).toISOString());
    settings.set('service_billing:twilio', JSON.stringify(record({ balance: 0 })));
    await Promise.all([refreshServiceBillingAlerts(db, now), refreshServiceBillingAlerts(db, now)]);
    expect(notices.size).toBe(2);
    expect(push).toHaveBeenCalledTimes(2);
    expect([...notices.keys()][1]).toContain(':after:');
  });
  it('clears failed invoice warnings when a newer receipt confirms payment', async () => {
    const { db, settings, notices } = database([
      record({ paymentStatus: 'failed', reference: 'INV-1' }),
    ]);
    await refreshServiceBillingAlerts(db, now);
    settings.set(
      'service_billing:twilio',
      JSON.stringify(record({ paymentStatus: 'paid', reference: 'INV-1' })),
    );
    await refreshServiceBillingAlerts(db, now);
    expect([...notices.values()][0].read).toBe(true);
    expect([...notices.values()][0].metadata.resolved_at).toBeDefined();
    expect(push).toHaveBeenCalledTimes(1);
  });
  it('recovers a definitely unattempted warning after a transient pre-push read failure', async () => {
    const { db, notices } = database([record({ balance: 0 })]);
    db.beforeReconcile = async () => {
      db.beforeReconcile = undefined;
      db.failNextRead = true;
    };
    await expect(refreshServiceBillingAlerts(db, now)).rejects.toThrow(
      'SERVICE_BILLING_ALERTS_UNAVAILABLE',
    );
    expect(push).not.toHaveBeenCalled();
    expect([...notices.values()][0].metadata.push_status).toBe('pending');
    await Promise.all([refreshServiceBillingAlerts(db, now), refreshServiceBillingAlerts(db, now)]);
    expect(notices.size).toBe(1);
    expect(push).toHaveBeenCalledTimes(1);
  });
  it('refreshes an unattempted warning amount before recovering its push', async () => {
    const { db, settings, notices } = database([record({ balance: 2 })]);
    db.beforeReconcile = async () => {
      db.beforeReconcile = undefined;
      db.failNextRead = true;
    };
    await expect(refreshServiceBillingAlerts(db, now)).rejects.toThrow(
      'SERVICE_BILLING_ALERTS_UNAVAILABLE',
    );
    settings.set(
      'service_billing:twilio',
      JSON.stringify(record({ balance: 1, revision: 'lower-balance' })),
    );
    await refreshServiceBillingAlerts(db, now);
    expect(notices.size).toBe(1);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][2].body).toContain('$1.00');
    expect(push.mock.calls[0][2].body).not.toContain('$2.00');
    const sent = [...notices.values()][0];
    settings.set(
      'service_billing:twilio',
      JSON.stringify(record({ balance: 0, revision: 'lower-again' })),
    );
    await refreshServiceBillingAlerts(db, now);
    expect(push).toHaveBeenCalledTimes(1);
    expect(sent.message).toContain('$1.00');
  });
  it('preserves resolution when push finishes after a recovery poll', async () => {
    const { db, settings, notices } = database([record({ balance: 2 })]);
    push.mockImplementationOnce(async () => {
      settings.set(
        'service_billing:twilio',
        JSON.stringify(record({ balance: 50, revision: 'recovered' })),
      );
      await refreshServiceBillingAlerts(db, now);
      return 1;
    });
    await refreshServiceBillingAlerts(db, now);
    expect([...notices.values()][0].metadata.resolved_at).toBeDefined();
    settings.set(
      'service_billing:twilio',
      JSON.stringify(record({ balance: 2, revision: 'low-again' })),
    );
    await refreshServiceBillingAlerts(db, now);
    expect(notices.size).toBe(2);
    expect(push).toHaveBeenCalledTimes(2);
  });
  it('does not let a stale poll resolve a newer critical warning', async () => {
    const { db, settings, notices } = database([record({ balance: 50 })]);
    db.beforeReconcile = async () => {
      db.beforeReconcile = undefined;
      settings.set(
        'service_billing:twilio',
        JSON.stringify(record({ balance: 0, revision: 'new-low' })),
      );
      await refreshServiceBillingAlerts(db, now);
    };
    await expect(refreshServiceBillingAlerts(db, now)).rejects.toThrow(
      'SERVICE_BILLING_ALERTS_UNAVAILABLE',
    );
    expect([...notices.values()][0].metadata.resolved_at).toBeUndefined();
    expect([...notices.values()][0].read).not.toBe(true);
  });
  it('creates a new warning with more than 1000 retained historical notices', async () => {
    const { db, notices } = database([record({ balance: 0 })]);
    for (let i = 0; i < 1100; i++)
      notices.set('old-' + i, {
        id: 'old-' + i,
        idempotency_key: 'old-' + i,
        metadata: { service_id: 'twilio', resolved_at: new Date(now).toISOString() },
        read: true,
      });
    await refreshServiceBillingAlerts(db, now);
    expect(notices.size).toBe(1101);
    expect(push).toHaveBeenCalledTimes(1);
  });
  it('refreshes only the exact Twilio account without changing invoice evidence or paying', async () => {
    const sid = 'AC' + '1'.repeat(32);
    secrets.mockResolvedValue({ TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: 'server-only' });
    const { db } = database([record({ autoRefresh: true, observedAt: '2026-11-13T00:00:00Z' })]);
    const request = vi
      .fn()
      .mockResolvedValue(Response.json({ account_sid: sid, balance: '0.00', currency: 'USD' }));
    await refreshConnectedBalances(db, now, request);
    const saved = (await readServiceBilling(db))[0]!;
    expect(saved.balance).toBe(0);
    expect(saved.observedAt).toBe('2026-11-13T00:00:00.000Z');
    expect(saved.balanceCheckedAt).toBe(new Date(now).toISOString());
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toMatch(/Balance.json$/);
    expect(request.mock.calls[0][1].method).toBeUndefined();
  });
  it('does not refresh a timestamp or hide a warning after provider rejection', async () => {
    secrets.mockResolvedValue({
      TWILIO_ACCOUNT_SID: 'AC' + '1'.repeat(32),
      TWILIO_AUTH_TOKEN: 'server-only',
    });
    const { db } = database([record({ autoRefresh: true })]);
    await refreshConnectedBalances(
      db,
      now,
      vi.fn().mockResolvedValue(new Response('private provider body', { status: 401 })),
    );
    const saved = (await readServiceBilling(db))[0]!;
    expect(saved.balanceCheckedAt).toBeUndefined();
    expect(saved.balanceError).toBe('unavailable');
    expect(billingSignals(saved, now).some((s) => s.kind === 'balance-connection')).toBe(true);
    expect(JSON.stringify(saved)).not.toContain('private provider body');
  });
});
