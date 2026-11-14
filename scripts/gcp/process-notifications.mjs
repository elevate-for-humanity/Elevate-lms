import { loadGoogleConfig } from './runtime-config.mjs';

// Credentials remain in memory and come from the canonical Google runtime secret.
// No response bodies, recipient addresses, or message contents are logged.
let phase = 'runtime_config';
async function main() {
  const { runtimeEnvironment } = loadGoogleConfig('admin');
  const secret = runtimeEnvironment.CRON_SECRET;
  if (!secret) throw Object.assign(new Error('Cron secret unavailable'), { code: 'cron_secret_missing' });
  const url = 'https://admin.elevateforhumanity.org/api/cron/process-notifications';
  const request = async method => {
    phase = method === 'GET' ? 'preflight' : 'delivery';
    const response = await fetch(url, {
      method, headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(method === 'POST' ? 55_000 : 15_000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success !== true || body.deliveryContract !== 2) {
      throw Object.assign(new Error('Notification delivery contract or processing failed'), {
        code: !response.ok ? `http_${response.status}` : body.deliveryContract !== 2 ? 'contract_mismatch' : 'processor_failed',
      });
    }
    return body;
  };
  // Prevent a repaired scheduler from draining an older, unsafe deployed handler.
  const status = await request('GET');
  console.log(JSON.stringify({ stage: 'review', held: status.stats.review_required }));
  const result = await request('POST');
  console.log(JSON.stringify({ stage: 'process', processed: result.processed, accepted: result.sent, failed: result.failed }));
}
main().catch((error) => {
  const allowedCodes = new Set(['cron_secret_missing', 'contract_mismatch', 'processor_failed', 'billing_disabled', 'api_disabled', 'permission_denied', 'not_found', 'authentication_failed', 'quota_exceeded', 'command_failed']);
  const code = allowedCodes.has(error?.code) || /^http_[1-5][0-9]{2}$/.test(String(error?.code))
    ? error.code : error?.name === 'TimeoutError' ? 'timeout' : 'request_failed';
  // Deliberately omit error.message, response bodies, configuration and recipient data.
  console.error(JSON.stringify({ stage: phase, code, automaticRetry: false }));
  process.exitCode = 1;
});
