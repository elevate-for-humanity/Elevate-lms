import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const project = 'elegant-racer-299721';
const parent = 'https://cloudquotas.googleapis.com/v1/projects/484736877039/locations/global';
export const targets = [
  {quotaId: 'CpuAllocPerProjectRegion', preferredValue: '32000', id: 'elevate-run-cpu-us-central1'},
  {quotaId: 'MemAllocPerProjectRegion', preferredValue: '68719476736', id: 'elevate-run-memory-us-central1'},
];
export function quotaContact(policy) {
  const owners = [...new Set((policy.bindings || []).filter(b => b.role === 'roles/owner' && !b.condition)
    .flatMap(b => b.members || []).filter(m => m.startsWith('user:')).map(m => m.slice(5)))];
  if (owners.length !== 1) throw Error('One existing human project owner is required for the quota contact; no request sent');
  return owners[0];
}
function validValue(value) {
  return typeof value === 'string' && /^(?:-1|0|[1-9]\d*)$/.test(value) && BigInt(value) <= 9223372036854775807n;
}
function atLeast(value, desired) {
  return validValue(value) && (value === '-1' || (desired !== '-1' && BigInt(value) >= BigInt(desired)));
}
function sanitizeText(value, secrets) {
  if (typeof value !== 'string') return undefined;
  let safe = value;
  for (const secret of secrets.filter(Boolean)) safe = safe.split(secret).join('[REDACTED]');
  return safe.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED JWT]')
    .replace(/((?:api[_-]?key|token|password|secret|authorization)\s*[:=]\s*)\S+/gi, '$1[REDACTED]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED EMAIL]').slice(0, 1000);
}
function providerState(body, secrets) {
  return {grantedValue: validValue(body.quotaConfig?.grantedValue) ? body.quotaConfig.grantedValue : undefined,
    reconciling: typeof body.reconciling === 'boolean' ? body.reconciling : undefined,
    stateDetail: sanitizeText(body.quotaConfig?.stateDetail, secrets),
    traceId: sanitizeText(body.quotaConfig?.traceId, secrets)};
}
export async function requestHeadroom(token, contactEmail, request = fetch, {requestMaximum = false} = {}) {
  if (typeof requestMaximum !== 'boolean') throw Error('requestMaximum must be an explicit boolean');
  const results = [];
  const headers = {authorization: 'Bearer ' + token, 'content-type': 'application/json'};
  const secrets = [token, contactEmail];
  const readQuota = async target => {
    const response = await request(parent + '/services/run.googleapis.com/quotaInfos/' + target.quotaId,
      {headers, signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw Error('Unable to read current quota; adjustment stopped for ' + target.quotaId);
    const info = await response.json();
    const value = (info.dimensionsInfos || []).find(x => x.dimensions?.region === 'us-central1')?.details?.value;
    if (!validValue(value)) throw Error('Regional quota value unavailable; adjustment stopped');
    return value;
  };
  for (const target of targets) {
    const desired = requestMaximum ? '-1' : target.preferredValue;
    const value = await readQuota(target);
    const name = 'projects/484736877039/locations/global/quotaPreferences/' + target.id;
    const endpoint = parent + '/quotaPreferences/' + target.id;
    const existingResponse = await request(endpoint,
      {headers, signal: AbortSignal.timeout(30000)});
    let existing;
    if (existingResponse.ok) {
      existing = await existingResponse.json();
      const names = [name, name.replace('/484736877039/', '/elegant-racer-299721/')];
      if (!names.includes(existing.name) || existing.service !== 'run.googleapis.com' || existing.quotaId !== target.quotaId ||
          Object.keys(existing.dimensions || {}).length !== 1 || existing.dimensions?.region !== 'us-central1' ||
          !validValue(existing.quotaConfig?.preferredValue) ||
          (existing.quotaConfig?.grantedValue !== undefined && !validValue(existing.quotaConfig.grantedValue)))
        throw Error('Owned quota preference identity, scope or value mismatch; adjustment stopped');
    } else if (existingResponse.status !== 404) {
      throw Error('Unable to read owned quota preference; adjustment stopped');
    }
    const alreadySufficient = atLeast(value, desired);
    const alreadyRequested = atLeast(existing?.quotaConfig?.preferredValue, desired);
    const alreadyGranted = atLeast(existing?.quotaConfig?.grantedValue, desired);
    if (alreadySufficient || alreadyRequested || alreadyGranted) {
      results.push({quotaId: target.quotaId, name, desiredValue: desired,
        requestedValue: existing?.quotaConfig?.preferredValue, effectiveValue: value,
        alreadySufficient, alreadyRequested, alreadyGranted, ...providerState(existing || {}, secrets)});
      continue;
    }
    if (existing && (typeof existing.etag !== 'string' || !existing.etag.trim()))
      throw Error('Owned quota preference etag required before update');
    // -1 requests unlimited quota under Google's normal review; it does not
    // promise a grant. Never bypass safety checks or replace another preference.
    const payload = {service: 'run.googleapis.com', quotaId: target.quotaId,
      dimensions: {region: 'us-central1'}, quotaConfig: {preferredValue: desired}, contactEmail,
      justification: requestMaximum
        ? 'The project owner requests the largest Cloud Run CPU and memory quota Google will approve in us-central1, using the documented unlimited preference. Current web services and rendering jobs exhaust 20 vCPU and 40 GiB and block rolling deployments. Google determines the approved limit; no container sizes or autoscaling settings are changed.'
        : 'Production web services reserve 16 vCPU and 32 GiB. An active course-rendering job uses 4 vCPU and 8 GiB, exhausting the current 20 vCPU and 40 GiB limits and blocking a verified rolling deployment. Request deployment headroom for current services and bounded worker concurrency; no container sizes or autoscaling settings are changed.'};
    const url = new URL(existing ? endpoint : parent + '/quotaPreferences');
    if (existing) {
      payload.name = name;
      payload.etag = existing.etag;
      url.searchParams.set('updateMask', 'quotaConfig.preferredValue,justification,contactEmail');
    } else {
      url.searchParams.set('quotaPreferenceId', target.id);
    }
    const response = await request(url, {
      method: existing ? 'PATCH' : 'POST', headers, signal: AbortSignal.timeout(30000), body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    let effectiveValue = value;
    let effectiveReadFailed;
    if (response.ok) {
      try {effectiveValue = await readQuota(target);}
      catch {effectiveValue = undefined; effectiveReadFailed = true;}
    }
    const safeCode = code => typeof code === 'string' && /^[A-Z][A-Z0-9_]{0,99}$/.test(code) ? code : undefined;
    results.push({quotaId: target.quotaId, previousValue: value,
      desiredValue: desired, requestedValue: desired, effectiveValue, effectiveReadFailed,
      httpStatus: response.status, accepted: response.ok, name, ...providerState(body, secrets),
      errorStatus: safeCode(body.error?.status), errorMessage: sanitizeText(body.error?.message, secrets),
      errorReasons: (body.error?.details || []).map(x => safeCode(x.reason)).filter(Boolean)});
  }
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const read = args => execFileSync('gcloud', args, {encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe']}).trim();
  const contact = quotaContact(JSON.parse(read(['projects', 'get-iam-policy', project, '--format=json'])));
  const token = read(['auth', 'print-access-token']);
  const flag = process.env.REQUEST_MAXIMUM || 'false';
  if (!['true', 'false'].includes(flag)) throw Error('REQUEST_MAXIMUM must be true or false');
  const requestMaximum = flag === 'true';
  const results = await requestHeadroom(token, contact, fetch, {requestMaximum});
  console.log(JSON.stringify({observedAt: new Date().toISOString(), project, region: 'us-central1', requestMaximum, results}));
  if (results.some(r => r.accepted === false || r.effectiveReadFailed)) process.exitCode = 1;
}
