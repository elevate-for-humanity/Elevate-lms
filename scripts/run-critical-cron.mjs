import { pathToFileURL } from 'node:url';

export function validateCronResponse(name, result) {
  if (name === 'daily-attendance-alerts') {
    return result?.ok === true && ['processed', 'alerts_created', 'critical_alerts']
      .every((key) => Number.isInteger(result[key]) && result[key] >= 0);
  }
  return name === 'autopilot-tick' && result?.success === true && result?.ok === true &&
    Array.isArray(result.errors) && result.errors.length === 0;
}

export async function runCriticalCron(name, method) {
  const methods = { 'daily-attendance-alerts': 'POST', 'autopilot-tick': 'GET' };
  if (!Object.hasOwn(methods, name) || methods[name] !== method) throw new Error('Unsupported cron operation');
  if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET is missing');
  const url = new URL(`/api/cron/${name}`, process.env.ADMIN_URL);
  let response;
  try {
    response = await fetch(url, { method, redirect: 'error',
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(60_000) });
  } catch { throw new Error(`${name} transport failed`); }
  console.log(`${name} HTTP ${response.status}`);
  if (response.status !== 200) throw new Error(`${name} returned unsuccessful HTTP status`);
  let result;
  try { result = await response.json(); }
  catch { throw new Error(`${name} response was not JSON`); }
  // Never print response bodies: they may contain student data or provider errors.
  if (!validateCronResponse(name, result)) throw new Error(`${name} reported unsuccessful processing`);
  console.log(`${name} verified successful`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCriticalCron(process.argv[2], process.argv[3]).catch((error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
