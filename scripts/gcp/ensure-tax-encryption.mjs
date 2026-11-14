import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { google, loadGoogleConfig, PROJECT } from './runtime-config.mjs';
const policy = JSON.parse(
  readFileSync(new URL('../../config/google-runtime-policy.json', import.meta.url)),
);
const component = policy.components.marketing;
const secret = 'elevate-marketing-tax-data-encryption-key';
const validKey = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
/** Provision once; never rotate a key that may already protect taxpayer records. */
export function ensureTaxEncryption({
  run = google,
  generateKey = () => randomBytes(32).toString('hex'),
} = {}) {
  const service = JSON.parse(
    run([
      'run',
      'services',
      'describe',
      component.service,
      '--project',
      PROJECT,
      '--region',
      policy.region,
      '--format=json',
    ]),
  );
  const spec = service.spec?.template?.spec;
  if (spec?.serviceAccountName !== component.identity)
    throw new Error('Unexpected taxpayer runtime identity');
  const env = spec.containers?.[0]?.env ?? [];
  const bound =
    env.find((entry) => entry.name === 'TAX_DATA_ENCRYPTION_KEY') ??
    env.find((entry) => entry.name === 'SSN_ENCRYPTION_KEY');
  if (bound) {
    let key = bound.value;
    if (bound.valueFrom?.secretKeyRef) {
      const ref = bound.valueFrom.secretKeyRef;
      const aliases = (
        service.spec?.template?.metadata?.annotations?.['run.googleapis.com/secrets'] ?? ''
      ).split(',');
      const match = aliases.find((item) => item.startsWith(ref.name + ':'));
      let name = ref.name;
      if (match) {
        const resource = match.slice(ref.name.length + 1);
        const parts = resource.match(/^projects\/([^/]+)\/secrets\/([^/]+)$/);
        if (!parts || ![PROJECT, policy.projectNumber].includes(parts[1]))
          throw new Error('Unexpected taxpayer secret project');
        name = parts[2];
      }
      key = run(['secrets', 'versions', 'access', ref.key, '--secret', name, '--project', PROJECT]);
    }
    if (!validKey(key))
      throw new Error(
        'Existing taxpayer encryption key has an invalid format; preserve it for investigation',
      );
    return { configured: true, created: false, binding: '' };
  }
  const config = loadGoogleConfig('marketing', run);
  const existing =
    config.runtimeEnvironment.TAX_DATA_ENCRYPTION_KEY ??
    config.runtimeEnvironment.SSN_ENCRYPTION_KEY;
  if (existing !== undefined) {
    if (!validKey(existing))
      throw new Error(
        'Existing taxpayer encryption key has an invalid format; preserve it for investigation',
      );
    return { configured: true, created: false, binding: '' };
  }
  let created = false;
  try {
    run(['secrets', 'describe', secret, '--project', PROJECT, '--format=json']);
  } catch (error) {
    if (error.code !== 'not_found') throw error;
    const key = generateKey();
    if (!validKey(key)) throw new Error('Invalid generated taxpayer encryption key');
    run(
      [
        'secrets',
        'create',
        secret,
        '--project',
        PROJECT,
        '--replication-policy=automatic',
        '--data-file=-',
        '--quiet',
      ],
      key,
    );
    created = true;
  }
  const iam = JSON.parse(
    run(['secrets', 'get-iam-policy', secret, '--project', PROJECT, '--format=json']),
  );
  if (
    (iam.bindings ?? []).some((b) =>
      (b.members ?? []).some((m) => m === 'allUsers' || m === 'allAuthenticatedUsers'),
    )
  )
    throw new Error('Taxpayer encryption secret has public access');
  const versionName = run([
    'secrets',
    'versions',
    'list',
    secret,
    '--project',
    PROJECT,
    '--filter=state:ENABLED',
    '--sort-by=~createTime',
    '--limit=1',
    '--format=value(name)',
  ]);
  const version = versionName.split('/').at(-1);
  if (!/^\d+$/.test(version ?? '')) throw new Error('No enabled taxpayer encryption key version');
  const key = created
    ? null
    : run(['secrets', 'versions', 'access', version, '--secret', secret, '--project', PROJECT]);
  if (!created && !validKey(key))
    throw new Error(
      'Existing taxpayer encryption key has an invalid format; preserve it for investigation',
    );
  run([
    'secrets',
    'add-iam-policy-binding',
    secret,
    '--project',
    PROJECT,
    '--member=serviceAccount:' + component.identity,
    '--role=roles/secretmanager.secretAccessor',
    '--condition=None',
    '--quiet',
  ]);
  return { configured: true, created, binding: `TAX_DATA_ENCRYPTION_KEY=${secret}:${version}` };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(ensureTaxEncryption()));
}
