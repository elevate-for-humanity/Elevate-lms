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
export async function requestHeadroom(token, contactEmail, request = fetch) {
  const results = [];
  for (const target of targets) {
    const headers = {authorization: 'Bearer ' + token, 'content-type': 'application/json'};
    const current = await request(parent + '/services/run.googleapis.com/quotaInfos/' + target.quotaId,
      {headers, signal: AbortSignal.timeout(30000)});
    const info = await current.json();
    if (!current.ok) throw Error('Unable to read current quota; no adjustment attempted for ' + target.quotaId);
    const dimension = (info.dimensionsInfos || []).find(x => x.dimensions?.region === 'us-central1');
    const value = dimension?.details?.value;
    if (!/^\d+$/.test(value || '')) throw Error('Regional quota value unavailable; adjustment stopped');
    if (BigInt(value) >= BigInt(target.preferredValue)) {
      results.push({quotaId: target.quotaId, effectiveValue: value, alreadySufficient: true});
      continue;
    }
    // Normal provider review with all safety checks enabled. A rejected request
    // is reported as rejected, and an existing preference is never overwritten.
    const response = await request(parent + '/quotaPreferences?quotaPreferenceId=' + target.id, {
      method: 'POST', headers, signal: AbortSignal.timeout(30000),
      body: JSON.stringify({service: 'run.googleapis.com', quotaId: target.quotaId,
        dimensions: {region: 'us-central1'}, quotaConfig: {preferredValue: target.preferredValue}, contactEmail,
        justification: 'Production web services reserve 16 vCPU and 32 GiB. An active course-rendering job uses 4 vCPU and 8 GiB, exhausting the current 20 vCPU and 40 GiB limits and blocking a verified rolling deployment. Request deployment headroom for current services and bounded worker concurrency; no container sizes or autoscaling settings are changed.'}),
    });
    const body = await response.json();
    results.push({quotaId: target.quotaId, previousValue: value, requestedValue: target.preferredValue,
      httpStatus: response.status, accepted: response.ok, name: body.name,
      grantedValue: body.quotaConfig?.grantedValue, reconciling: body.reconciling,
      errorStatus: body.error?.status, errorReasons: (body.error?.details || []).map(x => x.reason).filter(Boolean)});
  }
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const read = args => execFileSync('gcloud', args, {encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe']}).trim();
  const contact = quotaContact(JSON.parse(read(['projects', 'get-iam-policy', project, '--format=json'])));
  const token = read(['auth', 'print-access-token']);
  const results = await requestHeadroom(token, contact);
  console.log(JSON.stringify({observedAt: new Date().toISOString(), project, region: 'us-central1', results}));
  if (results.some(r => !r.alreadySufficient && !r.accepted)) process.exitCode = 1;
}
