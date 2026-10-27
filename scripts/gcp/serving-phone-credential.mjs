import {google, PROJECT} from './runtime-config.mjs';

// Read the exact serving revision's pinned binding. A bundled configuration's
// token or Secret Manager's latest alias is not proof of the deployed value.
export function servingPhoneCredential(health, run = google) {
  const service = 'elevate-admin-migration';
  const revision = health?.revision;
  if (health?.ready !== true || health?.healthy !== true ||
      typeof revision !== 'string' || !/^elevate-admin-migration-[a-z0-9-]+$/.test(revision) ||
      !/^[a-f0-9]{40}$/.test(health.commit || '')) throw Error('phone_serving_health_unverified');
  const flags = ['--project', PROJECT, '--region', 'us-central1', '--format=json'];
  const state = JSON.parse(run(['run', 'services', 'describe', service, ...flags]));
  if (!state.status?.traffic?.some(row => row.revisionName === revision && row.percent === 100))
    throw Error('phone_serving_traffic_unverified');
  const actual = JSON.parse(run(['run', 'revisions', 'describe', revision, ...flags]));
  const env = new Map((actual.spec?.containers?.[0]?.env || []).map(row => [row.name, row]));
  const provider = env.get('PBX_RUNTIME_CONFIG_PROVIDER')?.value || env.get('ELEVATE_RUNTIME_CONFIG_PROVIDER')?.value;
  if (provider !== 'google-secret-manager') throw Error('phone_runtime_authority_unverified');
  const binding = env.get('PBX_PROVISIONING_TOKEN');
  const reference = binding?.valueFrom?.secretKeyRef;
  if (binding?.value !== undefined || reference?.name !== 'elevate-pbx-provisioning-token' ||
      !/^[1-9][0-9]*$/.test(reference?.key || '')) throw Error('phone_pinned_credential_unverified');
  const token = run(['secrets', 'versions', 'access', reference.key, '--secret', reference.name, '--project', PROJECT]);
  if (typeof token !== 'string' || token.length < 32) throw Error('phone_bound_credential_invalid');
  return token;
}
