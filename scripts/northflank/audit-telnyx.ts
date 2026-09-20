#!/usr/bin/env tsx
/** Read-only, sanitized account-wide Telnyx voice audit. */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';
type Json = Record<string, any>;
const groupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
const numberId = process.env.TELNYX_PHONE_NUMBER_ID || '3050756061020554451';
const connectionId = process.env.TELNYX_CONNECTION_ID || '3051039365166794471';
const expectedNumber = process.env.TELNYX_PHONE_NUMBER || '+13179999620';
const webhook = process.env.TELNYX_WEBHOOK_URL || 'https://admin.elevateforhumanity.org/api/webhooks/telnyx';

function findSecret(root: unknown, key: string): string | undefined {
  const seen = new Set<unknown>();
  const walk = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          const row = item as Json;
          if (String(row.key ?? row.name ?? '') === key && typeof (row.value ?? row.secret) === 'string') return String(row.value ?? row.secret);
        }
        const found = walk(item); if (found) return found;
      }
      return;
    }
    const row = value as Json;
    if (typeof row[key] === 'string') return row[key];
    for (const nested of Object.values(row)) { const found = walk(nested); if (found) return found; }
  };
  return walk(root);
}

async function get(apiKey: string, path: string): Promise<Json> {
  const response = await fetch(`https://api.telnyx.com/v2${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });
  const text = await response.text();
  let body: Json = {}; try { body = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    const code = body.errors?.[0]?.code || response.status;
    throw new Error(`Telnyx endpoint failed (code ${code})`);
  }
  return body;
}
async function probe(apiKey: string, name: string, path: string) {
  try { return { name, ok: true, value: await get(apiKey, path) }; }
  catch (error) { return { name, ok: false, error: error instanceof Error ? error.message : String(error) }; }
}
function list(result: any): Json[] { return Array.isArray(result?.value?.data) ? result.value.data : []; }

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');
  const group = await nfFetch<Json>(projectApiPath(projectId, `/secrets/${groupId}`));
  const apiKey = process.env.TELNYX_API_KEY?.trim() || findSecret(group, 'TELNYX_API_KEY');
  const publicKey = process.env.TELNYX_PUBLIC_KEY?.trim() || findSecret(group, 'TELNYX_PUBLIC_KEY');
  if (!apiKey) throw new Error('TELNYX_API_KEY is unavailable');

  const results = await Promise.all([
    probe(apiKey, 'number', `/phone_numbers/${numberId}`),
    probe(apiKey, 'numbers', '/phone_numbers?page[size]=250'),
    probe(apiKey, 'application', `/call_control_applications/${connectionId}`),
    probe(apiKey, 'applications', '/call_control_applications?page[size]=250'),
    probe(apiKey, 'outbound_profiles', '/outbound_voice_profiles?page[size]=250'),
    probe(apiKey, 'verified_numbers', '/verified_numbers?page[size]=250'),
    probe(apiKey, 'webhook_deliveries', '/webhook_deliveries?page[size]=50'),
    probe(apiKey, 'balance', '/balance'),
  ]);
  for (const result of results) console.log(`AUDIT endpoint ${result.name}: ${result.ok ? 'reachable' : result.error}`);

  const byName = Object.fromEntries(results.map((r) => [r.name, r]));
  const number = byName.number?.value?.data;
  const app = byName.application?.value?.data;
  const numbers = list(byName.numbers);
  const apps = list(byName.applications);
  const profiles = list(byName.outbound_profiles);
  const verified = list(byName.verified_numbers);
  const deliveries = list(byName.webhook_deliveries);
  const balance = byName.balance?.value?.data || {};
  const deliverySummary = deliveries.reduce((summary: Record<string, number>, delivery: Json) => {
    const key = String(delivery.status || delivery.response_status_code || delivery.http_status_code || 'unknown');
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});
  const eventSummary = deliveries.reduce((summary: Record<string, number>, delivery: Json) => {
    const key = String(delivery.event_type || delivery.webhook?.event_type || delivery.event?.data?.event_type || 'unknown');
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});
  const deliveryTimes = deliveries
    .map((delivery: Json) => delivery.created_at || delivery.occurred_at || delivery.updated_at)
    .filter(Boolean)
    .sort();
  console.log('AUDIT webhook delivery summary ' + JSON.stringify({
    count: deliveries.length,
    statuses: deliverySummary,
    event_types: eventSummary,
    newest_at: deliveryTimes.at(-1) || null,
  }));
  console.log('AUDIT recent webhook deliveries ' + JSON.stringify(deliveries.slice(0, 12).map((delivery: Json) => ({
    event_type: delivery.event_type || delivery.webhook?.event_type || delivery.event?.data?.event_type || null,
    status: delivery.status || null,
    response_status_code: delivery.response_status_code || delivery.http_status_code || null,
    created_at: delivery.created_at || delivery.occurred_at || delivery.updated_at || null,
  }))));

  let webhookStatus = 0;
  try {
    const response = await fetch(webhook, { method: 'GET', redirect: 'manual' });
    webhookStatus = response.status;
  } catch {}
  const webhookReachable = webhookStatus > 0 && webhookStatus < 500;
  console.log(`AUDIT production webhook: ${webhookReachable ? 'reachable' : 'unreachable'} (HTTP ${webhookStatus || 'network-failure'})`);

  const status = String(number?.status || '').toLowerCase();
  const checks = {
    api_authenticated: results.every((r) => r.name === 'balance' || r.ok),
    webhook_signature_key_configured: Boolean(publicKey),
    owned_number_count: numbers.length,
    expected_number_found: Boolean(number),
    expected_number_matches: number?.phone_number === expectedNumber,
    expected_number_status: status || null,
    voice_capability_present: Array.isArray(number?.features)
      ? number.features.some((f: Json) => f.name === 'voice' && f.enabled !== false)
      : true,
    connection_assigned: String(number?.connection_id || '') === connectionId,
    call_control_app_count: apps.length,
    application_found: Boolean(app),
    application_active: app?.active === true,
    primary_webhook_matches: app?.webhook_event_url === webhook,
    webhook_api_v2: String(app?.webhook_api_version || '') === '2',
    production_webhook_reachable: webhookReachable,
    application_outbound_enabled: app?.outbound?.outbound_voice_profile_id != null || app?.outbound === true,
    failover_webhook_configured: Boolean(app?.webhook_event_failover_url),
    outbound_profile_count: profiles.length,
    forwarding_destination_verified: verified.some((v) => v.phone_number === '+13177607908'),
  };
  console.log('AUDIT inbound configuration ' + JSON.stringify({
    number: {
      status: number?.status || null,
      connection_id: number?.connection_id || null,
      features: number?.features || null,
      number_type: number?.phone_number_type || number?.number_type || null,
      requirements_status: number?.requirements_status || null,
      activation_status: number?.activation_status || null,
      connection_name: number?.connection_name || null,
      record_fields: number ? Object.keys(number).sort() : [],
      call_forwarding: number?.call_forwarding || null,
      inbound_call_screening: number?.inbound_call_screening || null,
    },
    account: {
      balance: balance?.balance ?? null,
      credit_limit: balance?.credit_limit ?? null,
      available_credit: balance?.available_credit ?? null,
      currency: balance?.currency ?? null,
    },
    application: {
      active: app?.active ?? null,
      webhook_api_version: app?.webhook_api_version || null,
      webhook_event_url: app?.webhook_event_url || null,
      webhook_event_failover_url: app?.webhook_event_failover_url || null,
      inbound: app?.inbound || null,
      outbound_configured: app?.outbound?.outbound_voice_profile_id != null || app?.outbound === true,
    },
  }));
  console.log('AUDIT HEALTH ' + JSON.stringify(checks));

  const blockers: string[] = [];
  if (!checks.webhook_signature_key_configured) blockers.push('TELNYX_PUBLIC_KEY is missing from production secrets');
  if (!checks.expected_number_found) blockers.push('expected number record missing');
  if (!checks.expected_number_matches) blockers.push('number ID maps to a different number');
  if (status && !['active', 'purchased'].includes(status)) blockers.push(`number status is ${status}`);
  if (!checks.voice_capability_present) blockers.push('voice capability is disabled');
  if (!checks.connection_assigned) blockers.push('number is not assigned to the expected Call Control application');
  if (!checks.application_found) blockers.push('Call Control application missing');
  if (!checks.application_active) blockers.push('Call Control application inactive');
  if (!checks.primary_webhook_matches) blockers.push('primary webhook mismatch');
  if (!checks.webhook_api_v2) blockers.push('webhook API is not v2');
  if (!checks.production_webhook_reachable) blockers.push('production webhook is unreachable');
  if (!checks.application_outbound_enabled) blockers.push('Call Control outbound calling is not configured');
  if (!checks.failover_webhook_configured) blockers.push('failover webhook missing');
  if (!checks.outbound_profile_count) blockers.push('outbound voice profile missing');
  if (!checks.forwarding_destination_verified) blockers.push('forwarding destination not verified');
  console.log('AUDIT BLOCKERS ' + JSON.stringify(blockers));
  if (blockers.length) process.exitCode = 2;
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
