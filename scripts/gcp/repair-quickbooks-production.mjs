import { pathToFileURL } from 'node:url';
import { google, PROJECT, loadGoogleConfig, configSecret } from './runtime-config.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const verifierKeys = ['QB_WEBHOOK_VERIFIER_TOKEN', 'QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN'];
export function resolveVerifier(environments, standalone = []) {
  const candidates = [...environments.flatMap(env => verifierKeys.map(key => env[key])), ...standalone]
    .filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
  const unique = [...new Set(candidates)];
  if (unique.length > 1) throw new Error('QB_VERIFIER_CONFLICT');
  return unique[0] || '';
}

/** Recover existing configuration only. Never generate a replacement Intuit verifier. */
export function repairQuickBooksProduction({ run = google, apply = false } = {}) {
  const listed = JSON.parse(run(['secrets', 'list', '--project', PROJECT, '--format=json']));
  const names = listed.map(item => item.name.split('/').at(-1));
  const configs = [];
  for (const component of ['admin', 'marketing', 'lms', 'store']) {
    if (!names.includes(configSecret(component))) throw new Error('QB_RUNTIME_CONFIG_UNAVAILABLE');
    configs.push({ component, config: loadGoogleConfig(component, run) });
  }
  const serving = [];
  for (const { component } of configs) {
    const service = JSON.parse(run(['run', 'services', 'describe', `elevate-${component}-migration`, '--project', PROJECT, '--region', 'us-central1', '--format=json']));
    const traffic = (service.status?.traffic || []).filter(item => item.percent > 0);
    if (traffic.length !== 1 || traffic[0].percent !== 100) throw new Error('QB_SERVING_REVISION_AMBIGUOUS');
    const revision = JSON.parse(run(['run', 'revisions', 'describe', traffic[0].revisionName, '--project', PROJECT, '--region', 'us-central1', '--format=json']));
    const env = {};
    for (const item of revision.spec.containers[0].env || []) {
      if (!verifierKeys.includes(item.name)) continue;
      const ref = item.valueFrom?.secretKeyRef;
      env[item.name] = typeof item.value === 'string' ? item.value : ref
        ? run(['secrets', 'versions', 'access', ref.key, '--secret', ref.name, '--project', PROJECT]) : '';
    }
    serving.push(env);
  }
  const standalone = [];
  for (const name of names.filter(name => /(?:quickbooks|(?:^|-)qb)(?:-|_).*?(?:webhook|verifier)/i.test(name))) {
    // Prepared, empty secrets have no enabled versions. Do not confuse them with lost credentials.
    const versions = JSON.parse(run(['secrets', 'versions', 'list', '--secret', name, '--project', PROJECT, '--filter=state:ENABLED', '--format=json']));
    if (versions.length) standalone.push(run(['secrets', 'versions', 'access', 'latest', '--secret', name, '--project', PROJECT]));
  }
  const verifier = resolveVerifier([...configs.map(item => item.config.runtimeEnvironment), ...serving], standalone);
  const report = { mode: apply ? 'repair' : 'audit', existingVerifierFound: Boolean(verifier), services: [] };
  const dir = mkdtempSync(join(tmpdir(), 'qb-production-'));
  try {
    for (const { component, config } of configs) {
      const updated = structuredClone(config);
      updated.runtimeEnvironment.QB_ENVIRONMENT = 'production';
      const updates = { QB_ENVIRONMENT: 'production' };
      if (verifier) {
        for (const key of verifierKeys) updated.runtimeEnvironment[key] = updates[key] = verifier;
      }
      if (apply) {
        const file = join(dir, component + '.json');
        writeFileSync(file, JSON.stringify(updated), { mode: 0o600 });
        if (JSON.stringify(updated) !== JSON.stringify(config)) {
          run(['secrets', 'versions', 'add', configSecret(component), '--data-file', file, '--project', PROJECT, '--format=value(name)']);
          if (JSON.stringify(loadGoogleConfig(component, run)) !== JSON.stringify(updated)) throw new Error('QB_CONFIG_READBACK_FAILED');
        }
        // Update only these keys; preserve the image, all other bindings and traffic policy.
        const envFile = join(dir, component + '-env.json');
        writeFileSync(envFile, JSON.stringify({ '--update-env-vars': updates }), { mode: 0o600 });
        run(['run', 'services', 'update', `elevate-${component}-migration`, '--project', PROJECT, '--region', 'us-central1', '--flags-file', envFile, '--quiet', '--format=value(status.latestReadyRevisionName)']);
      }
      if (apply) {
        const current = JSON.parse(run(['run', 'services', 'describe', `elevate-${component}-migration`, '--project', PROJECT, '--region', 'us-central1', '--format=json']));
        const traffic = (current.status?.traffic || []).filter(item => item.percent > 0);
        if (traffic.length !== 1 || traffic[0].percent !== 100) throw new Error('QB_SERVING_REVISION_AMBIGUOUS');
        const revision = JSON.parse(run(['run', 'revisions', 'describe', traffic[0].revisionName, '--project', PROJECT, '--region', 'us-central1', '--format=json']));
        const values = Object.fromEntries((revision.spec.containers[0].env || []).map(item => [item.name, item.value]));
        if (Object.entries(updates).some(([key, value]) => values[key] !== value)) throw new Error('QB_RUNTIME_READBACK_FAILED');
      }
      report.services.push({ component, productionConfigured: apply, verifierRecovered: apply && Boolean(verifier) });
    }
    return { ...report, companyAuthorizationVerified: false, webhookDeliveryVerified: false };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(repairQuickBooksProduction({ apply: process.env.QB_PRODUCTION_REPAIR === 'true' }))); }
  catch (error) { console.error(JSON.stringify({ error: /^QB_[A-Z_]+$/.test(error.message) ? error.message : error.code || 'QB_PRODUCTION_REPAIR_FAILED' })); process.exitCode = 1; }
}
