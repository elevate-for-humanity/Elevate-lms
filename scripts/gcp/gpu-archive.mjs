import { pathToFileURL } from 'node:url';
import { google, PROJECT, validateConfig } from './runtime-config.mjs';

export const SECRET = 'elevate-gpu-archive-config';
export const PROFILE = Object.freeze({ state: 'archived', computeEnabled: false,
  region: 'us-central1', accelerator: 'nvidia-l4', acceleratorCount: 1,
  llmModel: 'Qwen/Qwen2.5-7B-Instruct', videoModel: 'Wan-AI/Wan2.2-TI2V-5B',
  modelBucket: `${PROJECT}-elevate-model-archive`,
  rebuildOnGoogle: ['python virtual environments', 'CUDA libraries', 'compiled extensions'],
  health: { llm: '/health', videoLiveness: '/health', videoReadiness: '/ready' },
  activationRequires: ['verified model transfer', 'immutable images', 'Google runtime acceptance', 'explicit activation'] });

export async function archiveGPU({ request = fetch, run = google, env = process.env } = {}) {
  if (!env.NORTHFLANK_API_TOKEN) throw new Error('Source credentials required');
  const base = 'https://api.northflank.com/v1/projects/elevate-media-gpu';
  async function get(path) {
    const r = await request(`${base}/${path}`, { headers: { Authorization: `Bearer ${env.NORTHFLANK_API_TOKEN}` }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`Source HTTP ${r.status}`);
    const body = await r.json(); return body.data ?? body;
  }
  const listed = await get('services');
  const services = Array.isArray(listed) ? listed : listed.services;
  if (!Array.isArray(services)) throw new Error('Complete service inventory required');
  const configs = [];
  for (const item of services) {
    if (!['elevate-gpu-worker', 'elevate-llm-worker'].includes(item.id)) throw new Error('Unexpected source workload; audit required');
    const service = await get(`services/${item.id}`);
    if (service.deployment?.instances !== 0) throw new Error('Source must remain stopped');
    const resolved = await get(`services/${item.id}/runtime-environment?show=all&replaceTemplatedValues=true`);
    configs.push(validateConfig({ version: 1, component: item.id, runtimeEnvironment: resolved.runtimeEnvironment,
      runtimeFiles: resolved.runtimeFiles, volumes: [] }, item.id));
  }
  const rows = await get('volumes');
  const volumes = Array.isArray(rows) ? rows : rows.volumes;
  if (!Array.isArray(volumes)) throw new Error('Complete volume inventory required');
  const persistence = [];
  for (const item of volumes) {
    const v = await get(`volumes/${encodeURIComponent(item.id)}`);
    if (!Array.isArray(v.attachedObjects)) throw new Error('Complete attachment inventory required');
    persistence.push({ id: v.id, spec: v.spec, status: v.status, mounts: v.mounts ?? null,
      attachedObjects: v.attachedObjects, bytesVerified: false, deletionAllowed: false });
  }
  const payload = JSON.stringify({ version: 1, profile: PROFILE, sourceConfiguration: configs,
    sourcePersistence: persistence, importedAt: new Date().toISOString(), transferComplete: false });
  if (Buffer.byteLength(payload) > 65536) throw new Error('Archive exceeds secret size limit');
  const versions = run(['secrets', 'versions', 'list', SECRET, '--project', PROJECT, '--limit=1', '--format=value(name)']);
  if (versions) throw new Error('Archive already exists; Google configuration is authoritative');
  const added = JSON.parse(run(['secrets', 'versions', 'add', SECRET, '--project', PROJECT, '--data-file=-', '--format=json'], payload));
  const version = added.name?.split('/').at(-1);
  if (!/^\d+$/.test(version ?? '')) throw new Error('Exact written secret version required');
  if (run(['secrets', 'versions', 'access', version, '--secret', SECRET, '--project', PROJECT]) !== payload) throw new Error('Archive readback mismatch');
  return { configurationOwner: 'Google Secret Manager', state: 'archived', services: configs.length,
    volumes: persistence.length, modelBytesTransferred: false, deletionAllowed: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  archiveGPU().then(result => console.log(JSON.stringify(result))).catch(() => {
    console.error('GPU archive failed; source retained and no compute activated'); process.exitCode = 1;
  });
}
