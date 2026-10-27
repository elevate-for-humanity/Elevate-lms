import { loadGoogleConfig } from './runtime-config.mjs';

// Credentials remain in memory and come from the canonical Google runtime secret.
// No response bodies, recipient addresses, or message contents are logged.
async function main() {
  const { runtimeEnvironment } = loadGoogleConfig('admin');
  const secret = runtimeEnvironment.CRON_SECRET;
  if (!secret) throw new Error('Google Admin cron secret unavailable');
  const url = 'https://admin.elevateforhumanity.org/api/cron/process-notifications';
  const request = async method => {
    const response = await fetch(url, {
      method, headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(method === 'POST' ? 55_000 : 15_000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success !== true || body.deliveryContract !== 2) {
      throw new Error('Notification delivery contract or processing failed');
    }
    return body;
  };
  // Prevent a repaired scheduler from draining an older, unsafe deployed handler.
  const status = await request('GET');
  console.log(JSON.stringify({ stage: 'review', held: status.stats.review_required }));
  const result = await request('POST');
  console.log(JSON.stringify({ stage: 'process', processed: result.processed, accepted: result.sent, failed: result.failed }));
}
main().catch(() => {
  console.error('Notification worker failed. Inspect the protected outbox; no automatic retry was attempted.');
  process.exitCode = 1;
});
