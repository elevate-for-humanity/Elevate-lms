import { writeFileSync } from 'node:fs';
import { google, PROJECT } from './runtime-config.mjs';

export const PERMISSIONS = [
  'resourcemanager.projects.getIamPolicy', 'resourcemanager.projects.setIamPolicy',
  'iam.roles.create', 'iam.roles.get', 'iam.roles.list',
  'secretmanager.secrets.list', 'secretmanager.secrets.get', 'secretmanager.secrets.create',
  'secretmanager.secrets.setIamPolicy', 'secretmanager.versions.add', 'secretmanager.versions.access',
  'cloudscheduler.jobs.list', 'storage.buckets.list', 'compute.snapshots.list',
];

// List endpoints can return metadata containing sensitive values. Emit only
// operation/status and Google's structured error classification, never bodies.
export function summarizeAccess(operation, response, body) {
  const info = (body.error?.details ?? []).find(d => d['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo');
  return { operation, httpStatus: response.status, ok: response.ok,
    errorStatus: body.error?.status, reason: info?.reason,
    permission: PERMISSIONS.includes(info?.metadata?.permission) ? info.metadata.permission : undefined,
    disabledService: /^[a-z]+\.googleapis\.com$/.test(info?.metadata?.service ?? '') ? info.metadata.service : undefined };
}

export async function diagnoseAccess(token, request = fetch) {
  const checks = [];
  const operations = [
    ['secretMetadata', `https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets?pageSize=1`],
    ['scheduler', `https://cloudscheduler.googleapis.com/v1/projects/${PROJECT}/locations/us-central1/jobs?pageSize=1`],
    ['buckets', `https://storage.googleapis.com/storage/v1/b?project=${PROJECT}&maxResults=1`],
    ['snapshots', `https://compute.googleapis.com/compute/v1/projects/${PROJECT}/global/snapshots?maxResults=1`],
    ['projectPolicy', `https://cloudresourcemanager.googleapis.com/v3/projects/${PROJECT}:getIamPolicy`, {}],
    ['effectivePermissions', `https://cloudresourcemanager.googleapis.com/v3/projects/${PROJECT}:testIamPermissions`, { permissions: PERMISSIONS }],
  ];
  let granted = [];
  for (const [name, url, payload] of operations) {
    try {
      const response = await request(url, { method: payload ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined, signal: AbortSignal.timeout(30000) });
      const body = await response.json();
      checks.push(summarizeAccess(name, response, body));
      if (name === 'effectivePermissions' && response.ok) granted = PERMISSIONS.filter(p => (body.permissions ?? []).includes(p));
    } catch {
      checks.push({ operation: name, ok: false, reason: 'request_failed' });
    }
  }
  const preparationRequired = ['resourcemanager.projects.setIamPolicy', 'iam.roles.create', 'iam.roles.get', 'iam.roles.list'];
  return { project: PROJECT, identity: `elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`,
    observedAt: new Date().toISOString(), checks, granted,
    missing: PERMISSIONS.filter(p => !granted.includes(p)),
    canPrepareAccess: preparationRequired.every(p => granted.includes(p)) };
}

if (process.argv[1]?.endsWith('/diagnose-access.mjs')) {
  const report = await diagnoseAccess(google(['auth', 'print-access-token']));
  writeFileSync('google-access-diagnostic.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
