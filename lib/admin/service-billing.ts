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

/** Durable pending notices need an exclusive claim before any external push attempt. */
export async function refreshServiceBillingAlerts(db: SupabaseClient, now = Date.now()) {
  await refreshConnectedBalances(db, now);
  const records = await readServiceBilling(db);
  const { data: admins, error } = await db.rpc('service_billing_admin_recipients');
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
  // Each service reconciles under its billing-row lock. The database verifies the
  // exact revision, selects the latest episode and merges resolution atomically.
  // Retained history has no API page-size limit and never disables future alerts.
  const inserted: Array<{
    id: string;
    user_id: string;
    title: string;
    message: string;
    metadata: any;
    newly_created: boolean;
  }> = [];
  let reconciliationUnavailable = false;
  for (const record of records) {
    const result = await db.rpc('reconcile_service_billing_alerts', {
      p_service_id: record.serviceId,
      p_expected_revision: record.revision,
      p_notices: candidates.filter((n) => n.metadata.service_id === record.serviceId),
      p_now: new Date(now).toISOString(),
    });
    if (result.error) {
      reconciliationUnavailable = true;
      continue;
    }
    inserted.push(...(result.data || []));
  }
  const receipt = async (notice: (typeof inserted)[number], status: string, devices: number) => {
    const { error } = await db.rpc('record_service_billing_push_receipt', {
      p_id: notice.id,
      p_user_id: notice.user_id,
      p_status: status,
      p_devices: devices,
      p_now: new Date(now).toISOString(),
    });
    if (error) reconciliationUnavailable = true;
  };
  let pushAcceptedDevices = 0;
  for (const notice of inserted || []) {
    // A payment or balance update may have arrived while this poll was running.
    // Re-read before external push so a superseded warning is retained only as history.
    let latest: ServiceBillingRecord | undefined;
    try {
      latest = (await readServiceBilling(db)).find(
        (r) => r.serviceId === notice.metadata.service_id,
      );
    } catch {
      reconciliationUnavailable = true;
      continue;
    }
    const stillCurrent =
      latest &&
      billingSignals(latest, now).some(
        (s) => s.kind === notice.metadata.signal && s.episode === notice.metadata.episode,
      );
    if (!stillCurrent) {
      await receipt(notice, 'superseded', 0);
      continue;
    }
    // A same-band amount update still changes the notice's financial contents.
    // Leave it unattempted until reconciliation refreshes those contents under lock.
    if (notice.metadata.billing_revision !== latest!.revision) continue;
    const claim = await db.rpc('claim_service_billing_push', {
      p_id: notice.id,
      p_user_id: notice.user_id,
      p_service_id: latest!.serviceId,
      p_expected_revision: latest!.revision,
      p_now: new Date(now).toISOString(),
    });
    if (claim.error) {
      reconciliationUnavailable = true;
      continue;
    }
    if (!claim.data) continue;
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
    await receipt(notice, devices ? 'accepted' : 'unconfirmed', devices);
  }
  if (reconciliationUnavailable) throw Error('SERVICE_BILLING_ALERTS_UNAVAILABLE');
  return { created: inserted.filter((n) => n.newly_created).length, pushAcceptedDevices };
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
