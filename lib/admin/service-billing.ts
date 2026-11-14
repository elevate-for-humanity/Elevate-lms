import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { getSelectedRuntimeSecrets } from '@/lib/secrets';
import { getPushNotificationService } from '@/lib/notifications/push-service';
import {
  BILLING_SERVICES,
  SERVICE_BILLING_PREFIX,
  SERVICE_BILLING_PATH,
  billingSignals,
  validateServiceBilling,
  type ServiceBillingRecord,
} from './service-billing-policy';

export async function readServiceBilling(db: SupabaseClient): Promise<ServiceBillingRecord[]> {
  const { data, error } = await db
    .from('app_settings')
    .select('key,value')
    .like('key', 'service\\_billing:%');
  if (error) throw Error('SERVICE_BILLING_STORAGE_UNAVAILABLE');
  return (data || []).map((row) => {
    try {
      const x = JSON.parse(row.value);
      if (
        row.key !== SERVICE_BILLING_PREFIX + x.serviceId ||
        typeof x.revision !== 'string' ||
        !['manual', 'provider'].includes(x.source)
      )
        throw Error();
      if (x.balanceCheckedAt && !Number.isFinite(Date.parse(x.balanceCheckedAt))) throw Error();
      if (x.balanceError && !['not_configured', 'unavailable'].includes(x.balanceError))
        throw Error();
      return {
        ...validateServiceBilling(x),
        revision: x.revision,
        source: x.source,
        ...(x.balanceCheckedAt ? { balanceCheckedAt: x.balanceCheckedAt } : {}),
        ...(x.balanceError ? { balanceError: x.balanceError } : {}),
      };
    } catch {
      throw Error('SERVICE_BILLING_STATE_INVALID');
    }
  });
}

/** Compare-and-set protects a newer receipt/balance from a stale open form. */
export async function saveServiceBilling(
  db: SupabaseClient,
  input: unknown,
  expectedRevision: unknown,
) {
  const parsed = validateServiceBilling(input);
  if (expectedRevision !== null && typeof expectedRevision !== 'string')
    throw Error('SERVICE_BILLING_INVALID');
  const key = SERVICE_BILLING_PREFIX + parsed.serviceId;
  const { data: previous, error: readError } = await db
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (readError) throw Error('SERVICE_BILLING_STORAGE_UNAVAILABLE');
  if ((previous ? JSON.parse(previous.value).revision : null) !== expectedRevision)
    throw Error('SERVICE_BILLING_CONFLICT');
  const record: ServiceBillingRecord = { ...parsed, source: 'manual', revision: randomUUID() };
  const value = JSON.stringify(record);
  const query = previous
    ? db
        .from('app_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .eq('value', previous.value)
    : db
        .from('app_settings')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key', ignoreDuplicates: true },
        );
  const { data, error } = await query.select('key');
  if (error) throw Error('SERVICE_BILLING_SAVE_FAILED');
  if (!data?.length) throw Error('SERVICE_BILLING_CONFLICT');
  return record;
}

/** Only newly inserted durable notices may attempt a push, including concurrent polls. */
export async function refreshServiceBillingAlerts(db: SupabaseClient, now = Date.now()) {
  await refreshConnectedBalances(db, now);
  const records = await readServiceBilling(db);
  const { data: admins, error } = await db
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'super_admin'])
    .or('is_active.is.null,is_active.eq.true')
    .or('suspended.is.null,suspended.eq.false');
  if (error) throw Error('SERVICE_BILLING_RECIPIENTS_UNAVAILABLE');
  const candidates = records.flatMap((record) =>
    billingSignals(record, now).flatMap((signal) =>
      (admins || []).map((admin) => ({
        user_id: admin.id,
        type: signal.severity === 'critical' ? 'error' : 'warning',
        title: `${BILLING_SERVICES.find((s) => s.id === record.serviceId)!.name}: ${signal.kind.replaceAll('-', ' ')}`,
        message: signal.message,
        action_url: SERVICE_BILLING_PATH,
        action_label: 'Review service billing',
        idempotency_key: `service-billing:${record.serviceId}:${signal.kind}:${signal.episode}:${admin.id}`,
        metadata: {
          source: 'service-billing',
          service_id: record.serviceId,
          observed_at: record.observedAt,
          push_status: 'pending',
          signal: signal.kind,
          episode: signal.episode,
        },
      })),
    ),
  );
  // Read completed episodes too: a recovered wallet may later become low again.
  // User-reading an alert is not resolution of its underlying condition.
  const { data: previousNotices, error: previousNoticeError } = await db
    .from('notifications')
    .select('id,user_id,idempotency_key,metadata,read,created_at')
    .eq('metadata->>source', 'service-billing')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1000);
  if (previousNoticeError || previousNotices?.length === 1000)
    throw Error('SERVICE_BILLING_ALERTS_UNAVAILABLE');
  const latestByBase = new Map<string, (typeof previousNotices)[number]>();
  for (const notice of previousNotices || []) {
    const base = notice.metadata?.base_key || notice.idempotency_key;
    if (!latestByBase.has(base)) latestByBase.set(base, notice);
  }
  const notices = candidates.map((notice) => {
    const base = notice.idempotency_key;
    const previous = latestByBase.get(base);
    return {
      ...notice,
      idempotency_key: previous
        ? previous.metadata?.resolved_at
          ? `${base}:after:${previous.id}`
          : previous.idempotency_key
        : base,
      metadata: { ...notice.metadata, base_key: base },
    };
  });
  // Preserve history while clearing warnings whose condition has recovered.
  const activeKeys = new Set(notices.map((n) => n.idempotency_key));
  for (const notice of previousNotices || [])
    if (!notice.metadata?.resolved_at && !activeKeys.has(notice.idempotency_key)) {
      const { error: resolveError } = await db
        .from('notifications')
        .update({
          read: true,
          read_at: new Date(now).toISOString(),
          metadata: { ...notice.metadata, resolved_at: new Date(now).toISOString() },
        })
        .eq('id', notice.id)
        .eq('metadata->>source', 'service-billing');
      if (resolveError) throw Error('SERVICE_BILLING_ALERT_RESOLUTION_UNAVAILABLE');
    }
  if (!notices.length) return { created: 0, pushAcceptedDevices: 0 };
  const { data: inserted, error: insertError } = await db
    .from('notifications')
    .upsert(notices, { onConflict: 'idempotency_key', ignoreDuplicates: true })
    .select('id,user_id,title,message,metadata');
  if (insertError) throw Error('SERVICE_BILLING_ALERT_SAVE_FAILED');
  let pushAcceptedDevices = 0;
  for (const notice of inserted || []) {
    // A payment or balance update may have arrived while this poll was running.
    // Re-read before external push so a superseded warning is retained only as history.
    const latest = (await readServiceBilling(db)).find(
      (r) => r.serviceId === notice.metadata.service_id,
    );
    const stillCurrent =
      latest &&
      billingSignals(latest, now).some(
        (s) => s.kind === notice.metadata.signal && s.episode === notice.metadata.episode,
      );
    if (!stillCurrent) {
      const { error: resolveError } = await db
        .from('notifications')
        .update({
          read: true,
          read_at: new Date(now).toISOString(),
          metadata: {
            ...notice.metadata,
            resolved_at: new Date(now).toISOString(),
            push_status: 'superseded',
          },
        })
        .eq('id', notice.id)
        .eq('user_id', notice.user_id);
      if (resolveError) throw Error('SERVICE_BILLING_ALERT_RESOLUTION_UNAVAILABLE');
      continue;
    }
    let devices = 0;
    try {
      devices = await getPushNotificationService().sendToUserWithDatabase(db, notice.user_id, {
        title: notice.title,
        body: notice.message,
        url: SERVICE_BILLING_PATH,
        tag: `service-billing-${notice.id}`,
        requireInteraction: true,
      });
    } catch {
      /* A durable bell alert remains available; never auto-repeat an ambiguous push. */
    }
    pushAcceptedDevices += devices;
    const { error: receiptError } = await db
      .from('notifications')
      .update({
        metadata: {
          ...notice.metadata,
          push_status: devices ? 'accepted' : 'unconfirmed',
          accepted_devices: devices,
          push_attempted_at: new Date(now).toISOString(),
        },
      })
      .eq('id', notice.id)
      .eq('user_id', notice.user_id);
    if (receiptError) throw Error('SERVICE_BILLING_ALERT_RECEIPT_UNAVAILABLE');
  }
  return { created: inserted?.length || 0, pushAcceptedDevices };
}

/** Read-only provider balance; never tops up or changes auto-recharge. */
export async function refreshConnectedBalances(
  db: SupabaseClient,
  now = Date.now(),
  request: typeof fetch = fetch,
) {
  const records = await readServiceBilling(db);
  const current = records.find((r) => r.serviceId === 'twilio' && r.enabled && r.autoRefresh);
  if (!current) return;
  const key = SERVICE_BILLING_PREFIX + current.serviceId;
  const { data: previous, error } = await db
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error || !previous) throw Error('SERVICE_BILLING_STORAGE_UNAVAILABLE');
  if (JSON.parse(previous.value).revision !== current.revision) return;
  let next: ServiceBillingRecord;
  try {
    const secrets = await getSelectedRuntimeSecrets(
      ['TWILIO_ACCOUNT_SID', 'TWILIO_SID', 'TWILIO_AUTH_TOKEN'],
      { signal: AbortSignal.timeout(5000) },
    );
    const sid = (secrets.TWILIO_ACCOUNT_SID || secrets.TWILIO_SID || '').trim();
    const token = secrets.TWILIO_AUTH_TOKEN;
    if (!/^AC[0-9a-f]{32}$/i.test(sid) || !token)
      next = { ...current, balanceError: 'not_configured' };
    else {
      const response = await request(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`,
        {
          headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` },
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
          cache: 'no-store',
        },
      );
      if (!response.ok) throw Error();
      const value = await response.json();
      if (
        value.account_sid !== sid ||
        value.currency?.toUpperCase() !== 'USD' ||
        typeof value.balance !== 'string' ||
        !/^-?\d+(\.\d+)?$/.test(value.balance) ||
        !Number.isFinite(Number(value.balance)) ||
        Math.abs(Number(value.balance)) > 1e9
      )
        throw Error();
      next = {
        ...current,
        balance: Number(value.balance),
        balanceCheckedAt: new Date(now).toISOString(),
      };
      delete next.balanceError;
    }
  } catch {
    next = { ...current, balanceError: 'unavailable' };
  }
  next.revision = randomUUID();
  const { error: saveError } = await db
    .from('app_settings')
    .update({ value: JSON.stringify(next), updated_at: new Date(now).toISOString() })
    .eq('key', key)
    .eq('value', previous.value);
  if (saveError) throw Error('SERVICE_BILLING_SAVE_FAILED');
}
