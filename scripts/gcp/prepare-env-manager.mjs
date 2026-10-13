import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';

const policy = JSON.parse(readFileSync(new URL('../../config/google-runtime-policy.json', import.meta.url), 'utf8'));
const WRITER = ['secretmanager.secrets.get', 'secretmanager.secrets.getIamPolicy', 'secretmanager.versions.add', 'secretmanager.versions.get'];
const OPERATOR = ['run.services.get', 'run.services.update'];

export function prepareEnvManager(component = 'admin', run = google) {
  if (!Object.hasOwn(policy.components, component)) throw new Error('Unsupported runtime component');
  if (!run(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'])) throw new Error('No active Google account. Run gcloud auth login with the project administrator account.');
  run(['auth', 'print-access-token']); // Validate refresh without printing the token.
  const destination = policy.components[component];
  const manager = `elevate-admin-runtime@${PROJECT}.iam.gserviceaccount.com`;
  // Never create a replacement service or silently change its runtime identity.
  const service = JSON.parse(run(['run', 'services', 'describe', destination.service, '--project', PROJECT, '--region', policy.region, '--format=json']));
  if (service.spec?.template?.spec?.serviceAccountName !== destination.identity) throw new Error('Expected dedicated runtime identity is not deployed. No preparation performed.');
  for (const identity of new Set([manager, destination.identity])) run(['iam', 'service-accounts', 'describe', identity, '--project', PROJECT, '--format=value(email)']);
  run(['services', 'enable', 'secretmanager.googleapis.com', 'run.googleapis.com', '--project', PROJECT, '--quiet']);
  function role(id, permissions) {
    const name = `projects/${PROJECT}/roles/${id}`;
    const roles = JSON.parse(run(['iam', 'roles', 'list', '--project', PROJECT, '--filter', `name=${name}`, '--format=json']));
    if (roles.length) {
      const existing = JSON.parse(run(['iam', 'roles', 'describe', id, '--project', PROJECT, '--format=json']));
      if (roles.length !== 1 || existing.deleted || JSON.stringify([...(existing.includedPermissions ?? [])].sort()) !== JSON.stringify([...permissions].sort())) throw new Error('Existing configuration role differs from the confined permission set.');
    } else run(['iam', 'roles', 'create', id, '--project', PROJECT, '--title', id, '--permissions', permissions.join(','), '--stage', 'GA', '--quiet']);
    return name;
  }
  const writer = role('elevateRuntimeSecretWriterV1', WRITER);
  const operator = role('elevateRuntimeConfigOperatorV1', OPERATOR);
  for (const key of destination.keys) {
    const secret = `elevate-${component}-${key.toLowerCase().replaceAll('_', '-')}`;
    const listed = JSON.parse(run(['secrets', 'list', '--project', PROJECT, '--filter', `name:/${secret}`, '--format=json']));
    const existing = listed.find(item => item.name.split('/').at(-1) === secret);
    if (existing && (existing.labels?.elevate_component !== component || existing.labels?.elevate_key !== key.toLowerCase())) throw new Error('Existing secret has different ownership. No payloads changed.');
    if (!existing) run(['secrets', 'create', secret, '--project', PROJECT, '--replication-policy=automatic', '--labels', `elevate_component=${component},elevate_key=${key.toLowerCase()}`, '--quiet']);
    run(['secrets', 'add-iam-policy-binding', secret, '--project', PROJECT, '--member', `serviceAccount:${manager}`, '--role', writer, '--condition=None', '--quiet']);
    run(['secrets', 'add-iam-policy-binding', secret, '--project', PROJECT, '--member', `serviceAccount:${destination.identity}`, '--role', 'roles/secretmanager.secretAccessor', '--condition=None', '--quiet']);
  }
  for (const role of [operator, 'roles/run.invoker']) run(['run', 'services', 'add-iam-policy-binding', destination.service, '--project', PROJECT, '--region', policy.region, '--member', `serviceAccount:${manager}`, '--role', role, '--condition=None', '--quiet']);
  run(['iam', 'service-accounts', 'add-iam-policy-binding', destination.identity, '--project', PROJECT, '--member', `serviceAccount:${manager}`, '--role', 'roles/iam.serviceAccountUser', '--condition=None', '--quiet']);
  return { component, preparedSecrets: destination.keys.length, payloadsTransferred: 0, projectWideSecretAccess: false, runtimeChanged: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(prepareEnvManager(process.argv[2] ?? 'admin'))); }
  catch (error) { console.error(`Google Env Manager preparation failed [${error.code || 'validation_failed'}]: ${error.message}`); process.exitCode = 1; }
}
