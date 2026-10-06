import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const project = 'elegant-racer-299721';
const region = 'us-central1';
const reserved = new Set(['PORT', 'K_SERVICE', 'K_REVISION', 'K_CONFIGURATION']);
export const targets = {
  'elevate-marketing': ['service', 'elevate-marketing-migration'],
  'elevate-admin': ['service', 'elevate-admin-migration'],
  'elevate-lms': ['service', 'elevate-lms-migration'],
  'elevate-store': ['service', 'elevate-store-migration', 'elevate-store'],
  'elevate-studio-browser': ['service', 'elevate-studio-browser-migration', 'elevate-studio-browser'],
  'elevate-ultimate-worker': ['job', 'elevate-course-builder'],
};

// Values stay in memory. Reports contain names and comparison results only.
export function compareEnvironments(source, target, kind) {
  if (!source || typeof source !== 'object' || Array.isArray(source))
    throw new Error('Resolved source environment unavailable');
  const actual = new Map((target ?? []).map(row => [row.name, row]));
  const result = { matched: 0, adapted: [], missing: [], different: [], secretReferences: [], unresolved: [] };
  for (const [key, value] of Object.entries(source)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error('Invalid environment key');
    if (reserved.has(key) || key.startsWith('X_GOOGLE_')) { result.adapted.push(key); continue; }
    if (typeof value !== 'string' || /\$\{[^}]+\}/.test(value)) { result.unresolved.push(key); continue; }
    if (kind === 'job' && key === 'ULTIMATE_WORKER_ID') { result.adapted.push(key); continue; }
    const row = actual.get(key);
    if (!row) { result.missing.push(key); continue; }
    if (row.valueFrom || row.valueSource) { result.secretReferences.push(key); continue; }
    if ((row.value ?? '') === value) { result.matched++; continue; }
    if (key === 'HOSTNAME' && row.value === '0.0.0.0') { result.adapted.push(key); continue; }
    const workerOverrides = { AI_PROVIDER: 'none', AI_NARRATION_PROVIDER: 'kokoro', AI_TRANSCRIPTION_PROVIDER: 'local_whisper' };
    if (kind === 'job' && workerOverrides[key] === row.value) { result.adapted.push(key); continue; }
    result.different.push(key);
  }
  result.passed = ![result.missing, result.different, result.secretReferences, result.unresolved].some(x => x.length);
  return result;
}

export function runtimeContainer(resource, kind) {
  const spec = kind === 'job' ? resource?.spec?.template?.spec?.template?.spec : resource?.spec?.template?.spec;
  if (!spec || !Array.isArray(spec.containers) || spec.containers.length !== 1)
    throw new Error('Unsupported Google container topology');
  return { spec, container: spec.containers[0] };
}

export function healthPassed(component, path, status, body) {
  if (status !== 200 || body?.service !== component) return false;
  if (path === '/api/health') return body.healthy === true && body.ready === true && body.dependencies?.supabase?.ok === true;
  if (path === '/api/ready') return body.ready === true && (component !== 'admin' || body.agenticExecutorReady === true);
  return false;
}

export async function main() {
  const report = { services: [], sourceResources: {}, failures: [] };
  const token = process.env.NORTHFLANK_API_TOKEN;
  if (!token) throw new Error('Source read connection unavailable');
  const sourceProject = encodeURIComponent(process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform');
  async function northflank(path) {
    const r = await fetch(`https://api.northflank.com/v1/projects/${sourceProject}${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`Source request failed: HTTP ${r.status}`);
    const body = await r.json();
    return body.data ?? body;
  }
  function gcloud(args) {
    const r = spawnSync('gcloud', [...args, '--project', project, '--format=json'], {
      encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 60000,
    });
    // Raw provider responses and CLI diagnostics can contain credentials.
    if (r.status !== 0) throw new Error('Google resource read unavailable');
    return JSON.parse(r.stdout);
  }
  const sourceList = await northflank('/services');
  const services = Array.isArray(sourceList) ? sourceList : sourceList.services;
  if (!Array.isArray(services) || !services.length) throw new Error('Source service inventory unavailable');
  const googleServices = gcloud(['run', 'services', 'list', '--region', region]);
  const googleJobs = gcloud(['run', 'jobs', 'list', '--region', region]);
  for (const item of services) {
    if (!/^[a-z0-9-]+$/.test(item.id ?? '')) throw new Error('Invalid source service identifier');
    const entry = { source: item.id, passed: false };
    report.services.push(entry);
    try {
      const mapping = targets[item.id];
      if (!mapping) throw new Error('Source service has no reviewed Google mapping');
      const [kind, ...names] = mapping;
      const candidates = (kind === 'job' ? googleJobs : googleServices).filter(x => names.includes(x.metadata?.name));
      if (candidates.length !== 1) throw new Error('Google target missing or ambiguous');
      entry.target = candidates[0].metadata.name;
      entry.kind = kind;
      const resource = gcloud(['run', kind === 'job' ? 'jobs' : 'services', 'describe', entry.target, '--region', region]);
      const { spec, container } = runtimeContainer(resource, kind);
      const service = await northflank(`/services/${item.id}`);
      const environment = await northflank(`/services/${item.id}/runtime-environment?show=all&replaceTemplatedValues=true`);
      entry.environment = compareEnvironments(environment.runtimeEnvironment, container.env, kind);
      entry.sourceHealth = (service.healthChecks ?? []).map(x => ({ type: x.type, path: x.path, port: x.port }));
      entry.googleHealth = { startup: Boolean(container.startupProbe), liveness: Boolean(container.livenessProbe) };
      entry.volumeCounts = { source: (service.deployment?.volumes ?? service.volumes ?? []).length, google: (spec.volumes ?? []).length };
      entry.runtimeFileCount = Object.keys(environment.runtimeFiles ?? {}).length;
      entry.commandOverride = Boolean(service.deployment?.command || service.runtime?.command || service.config?.command);
      entry.googleResources = container.resources?.limits;
      entry.requiresPersistentDataVerification = entry.volumeCounts.source > 0 || entry.runtimeFileCount > 0 || item.id === 'elevate-studio-browser';
      entry.passed = entry.environment.passed && !entry.requiresPersistentDataVerification && !entry.commandOverride &&
        (kind === 'job' || (entry.googleHealth.startup && entry.googleHealth.liveness));
      if (kind === 'job') {
        entry.finiteExecution = container.env?.some(x => x.name === 'ULTIMATE_WORKER_ONCE' && x.value === 'true') === true;
        // A finite job alone does not demonstrate the source's continuous queue consumer.
        entry.workerSchedulingVerified = false;
        entry.passed = false;
      }
    } catch {
      // Error reasons deliberately exclude response bodies, values, and arbitrary input.
      entry.error = entry.target ? 'runtime_configuration_unverified' : 'google_target_missing_or_source_unmapped';
    }
  }
  for (const id of Object.keys(targets)) {
    if (!services.some(s => s.id === id)) report.failures.push({ resource: id, error: 'expected_source_missing' });
  }
  for (const resource of ['volumes', 'secrets', 'jobs', 'addons']) {
    try {
      const body = await northflank(`/${resource}`);
      const items = Array.isArray(body) ? body : body[resource];
      if (!Array.isArray(items)) throw new Error('Unknown resource response');
      report.sourceResources[resource] = items.map(x => ({ id: x.id, name: x.name }));
      if (items.length) report.failures.push({ resource, error: 'resource_contents_and_target_mapping_not_verified', count: items.length });
    } catch { report.failures.push({ resource, error: 'resource_inventory_unavailable' }); }
  }
  report.passed = report.services.every(x => x.passed) && report.failures.length === 0;
  writeFileSync('google-runtime-parity.json', JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(report));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => { console.error('Complete migration audit failed; no configuration was changed.'); process.exitCode = 1; });
