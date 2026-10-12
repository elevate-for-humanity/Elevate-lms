#!/usr/bin/env tsx
/** Register only the production Telnyx failover webhook. */
import { loadGoogleConfig } from '../gcp/runtime-config.mjs';
type Json = Record<string, any>;
const connectionId = process.env.TELNYX_CONNECTION_ID || '3051039365166794471';
const failoverUrl =
  process.env.TELNYX_FAILOVER_WEBHOOK_URL ||
  'https://admin.elevateforhumanity.org/api/webhooks/telnyx/failover';

async function request(apiKey: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`https://api.telnyx.com/v2${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });
  const body = await response.json().catch(() => ({})) as Json;
  if (!response.ok) {
    const code = body.errors?.[0]?.code || response.status;
    throw new Error(`Telnyx request failed (code ${code})`);
  }
  return body;
}

async function main() {
  const config = loadGoogleConfig('admin');
  const apiKey = process.env.TELNYX_API_KEY?.trim() || config.TELNYX_API_KEY;
  if (!apiKey) throw new Error('TELNYX_API_KEY is unavailable');

  const before = await request(apiKey, `/call_control_applications/${connectionId}`);
  if (String(before.data?.webhook_event_failover_url || '') !== failoverUrl) {
    await request(apiKey, `/call_control_applications/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ webhook_event_failover_url: failoverUrl }),
    });
  }
  const after = await request(apiKey, `/call_control_applications/${connectionId}`);
  if (String(after.data?.webhook_event_failover_url || '') !== failoverUrl) {
    throw new Error('Telnyx failover webhook verification failed');
  }
  console.log('TELNYX FAILOVER WEBHOOK VERIFIED');
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
