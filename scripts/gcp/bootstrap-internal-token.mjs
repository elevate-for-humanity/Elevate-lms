#!/usr/bin/env node
/**
 * Owner-controlled first-time provisioning of Elevate-owned internal tokens.
 * Dry-run by default. Does not issue third-party credentials, modify IAM,
 * attach Cloud Run secrets, deploy, or rotate existing values.
 *
 * node scripts/gcp/bootstrap-internal-token.mjs --component admin --key STUDIO_BROWSER_SECRET
 * node scripts/gcp/bootstrap-internal-token.mjs --component admin --key STUDIO_BROWSER_SECRET --apply
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const policy = JSON.parse(readFileSync(new URL('../../config/google-runtime-policy.json', import.meta.url), 'utf8'));
export const GENERATABLE_INTERNAL_KEYS = Object.freeze([
  'STUDIO_BROWSER_SECRET', 'CRON_SECRET', 'NEXTAUTH_SECRET',
]);
export function planTokenBootstrap({ component, key, apply = false }) {
  const runtime = policy.components[component];
  if (!runtime) throw new Error('Unknown component');
  if (!GENERATABLE_INTERNAL_KEYS.includes(key) || !runtime.keys.includes(key)) {
    throw new Error('This key is not approved for internal generation in this component');
  }
  return {
    component, key, apply, project: policy.project,
    secretName: `elevate-${component}-${key.toLowerCase().replaceAll('_', '-')}`,
  };
}
function gcloud(args, input) {
  const result = spawnSync('gcloud', args, {
    encoding: 'utf8', input, maxBuffer: 1024 * 1024,
    stdio: input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) {
    // Do not echo external stderr or token-bearing arguments into logs.
    throw new Error('Google Cloud operation unsuccessful; no successful provisioning claimed');
  }
  return result.stdout.trim();
}
export function bootstrap(plan) {
  if (!plan.apply) return { ...plan, status: 'dry-run', changed: false };
  const { project, secretName, component, key } = plan;
  // Fail closed if gcloud is pointed at a different project.
  const currentProject = gcloud(['config', 'get-value', 'project']);
  if (currentProject !== project) throw new Error('Active gcloud project differs from approved project');
  // Exact ownership is checked before any version is added.
  const name = `projects/${project}/secrets/${secretName}`;
  let existing = null;
  const check = spawnSync('gcloud', ['secrets', 'describe', secretName, '--project', project, '--format=json'], {encoding:'utf8'});
  if (check.status === 0) existing = JSON.parse(check.stdout);
  else {
    // A permission/network error is NOT proof a secret is absent.
    const err = String(check.stderr || '');
    if (!/(NOT_FOUND|NOT FOUND|not found|404)/i.test(err)) throw new Error('Cannot determine whether secret exists; aborting');
  }
  if (existing) {
    if (existing.name !== name ||
        existing.labels?.elevate_component !== component ||
        existing.labels?.elevate_key !== key.toLowerCase()) {
      throw new Error('Existing secret ownership cannot be verified');
    }
    // No implicit rotation, even if existing secret lacks a version.
    return { component, key, status:'already-exists', changed:false };
  }
  gcloud(['secrets','create',secretName,'--project',project,'--replication-policy=automatic',
    '--labels',`elevate_component=${component},elevate_key=${key.toLowerCase()}`]);
  const token = randomBytes(48).toString('base64url');
  try {
    gcloud(['secrets','versions','add',secretName,'--project',project,'--data-file=-'],token);
  } finally {
    // Avoid printing, persisting or returning token material.
  }
  return { component, key, status:'created', changed:true, runtimeBound:false };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const args = process.argv.slice(2);
    const value = name => { const i=args.indexOf(name); return i<0 ? undefined : args[i+1]; };
    const plan = planTokenBootstrap({component:value('--component'),key:value('--key'),apply:args.includes('--apply')});
    console.log(JSON.stringify(bootstrap(plan)));
  } catch (err) {
    console.error(`Credential bootstrap failed: ${err.message}`);
    process.exitCode = 1;
  }
}
