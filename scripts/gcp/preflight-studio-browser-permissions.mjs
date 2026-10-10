import { execFileSync } from 'node:child_process';
const project = 'elegant-racer-299721';
const required = [
  'secretmanager.secrets.create',
  'secretmanager.versions.add',
  'secretmanager.secrets.setIamPolicy',
  'storage.buckets.create',
  'storage.buckets.setIamPolicy',
  'run.services.create',
  'run.services.update',
];
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', timeout: 30000, stdio: ['ignore','pipe','pipe'] }).trim();
const response = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects/' + project + ':testIamPermissions', {
  method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
  body: JSON.stringify({ permissions: required }), signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error('Studio provisioning permission preflight failed: HTTP ' + response.status);
const { permissions = [] } = await response.json();
const missing = required.filter(permission => !permissions.includes(permission));
console.log(JSON.stringify({ project, deploymentPrincipal: 'elevate-github-deploy@' + project + '.iam.gserviceaccount.com', provisioningReady: missing.length === 0, missingPermissions: missing }));
if (missing.length) throw new Error('Studio provisioning is blocked by Google IAM; no browser build, credential rotation, or Admin cutover was attempted.');
