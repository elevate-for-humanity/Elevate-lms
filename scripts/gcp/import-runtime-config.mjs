import { pathToFileURL } from 'node:url';
import { configSecret, validateConfig, google, PROJECT } from './runtime-config.mjs';

// One-time compatibility boundary. Deployment consumers never call Northflank.
export async function importRuntimeConfig(component, { request = fetch, run = google, env = process.env } = {}) {
  const secret = configSecret(component);
  if (!env.NORTHFLANK_API_TOKEN) throw new Error('Source connection required for one-time import');
  const base = `https://api.northflank.com/v1/projects/${encodeURIComponent(env.NORTHFLANK_PROJECT_ID || 'elevate-platform')}/services/elevate-${component}`;
  async function get(url) {
    const response = await request(url, { headers: { Authorization: `Bearer ${env.NORTHFLANK_API_TOKEN}` }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Source configuration HTTP ${response.status}`);
    const body = await response.json(); return body.data ?? body;
  }
  const service = await get(base);
  const source = await get(`${base}/runtime-environment?show=all&replaceTemplatedValues=true`);
  if (!source.runtimeEnvironment || !Object.hasOwn(source, 'runtimeFiles')) throw new Error('Complete resolved runtime inventory required');
  const config = validateConfig({ version: 1, component, runtimeEnvironment: source.runtimeEnvironment,
    runtimeFiles: source.runtimeFiles, volumes: service.deployment?.volumes ?? service.volumes ?? [],
    importedAt: new Date().toISOString() }, component);
  // Refuse silent replacement of the now-authoritative Google configuration.
  const exists = run(['secrets', 'list', '--project', PROJECT, `--filter=name:${secret}`, '--format=value(name)']);
  if (exists) throw new Error('Google configuration already exists; use Google-owned configuration management');
  run(['secrets', 'create', secret, '--project', PROJECT, '--replication-policy=automatic']);
  run(['secrets', 'versions', 'add', secret, '--project', PROJECT, '--data-file=-'], JSON.stringify(config));
  const readback = JSON.parse(run(['secrets', 'versions', 'access', 'latest', '--secret', secret, '--project', PROJECT]));
  if (JSON.stringify(readback) !== JSON.stringify(config)) throw new Error('Google configuration readback mismatch');
  return { component, runtimeKeys: Object.keys(config.runtimeEnvironment).sort(), volumes: config.volumes.length,
    runtimeFiles: Object.keys(config.runtimeFiles).length, configurationOwner: 'Google Secret Manager' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  importRuntimeConfig(process.env.COMPONENT).then(result => console.log(JSON.stringify(result))).catch(() => {
    console.error('Runtime import failed; no deployment or cutover performed'); process.exitCode = 1;
  });
}
