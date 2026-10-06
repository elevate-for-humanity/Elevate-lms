import { pathToFileURL } from 'node:url';
import { configSecret, validateConfig, google, PROJECT } from './runtime-config.mjs';

// One-time compatibility boundary. Deployment consumers never call Northflank.
export async function importRuntimeConfig(component, { request = fetch, run = google, env = process.env } = {}) {
  const secret = configSecret(component);
  const invoke = (phase, args, input) => {
    try { return run(args, input); }
    catch (error) {
      const code = ['api_disabled', 'permission_denied', 'not_found', 'authentication_failed', 'quota_exceeded'].includes(error.code) ? error.code : 'command_failed';
      throw new Error(`Runtime import failed at ${phase}: ${code}`);
    }
  };
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
  // Standalone volumes are attached through their own resource, not necessarily
  // represented in service.deployment.volumes. Missing discovery must fail closed.
  const volumeBase = base.replace(/\/services\/[^/]+$/, '/volumes');
  const listed = await get(volumeBase);
  const items = Array.isArray(listed) ? listed : listed.volumes;
  if (!Array.isArray(items)) throw new Error('Runtime persistence inventory required');
  const volumes = [...(service.deployment?.volumes ?? service.volumes ?? [])];
  for (const item of items) {
    if (typeof item.id !== 'string') throw new Error('Runtime persistence inventory required');
    const volume = await get(`${volumeBase}/${encodeURIComponent(item.id)}`);
    if (!Array.isArray(volume.attachedObjects)) throw new Error('Runtime persistence inventory required');
    if (volume.attachedObjects.some(o => o.type === 'service' && o.id === `elevate-${component}`) && !volumes.some(v => v.id === volume.id))
      volumes.push({ id: volume.id, spec: volume.spec, attachedObjects: volume.attachedObjects, mountInventoryVerified: false });
  }
  const config = validateConfig({ version: 1, component, runtimeEnvironment: source.runtimeEnvironment,
    runtimeFiles: source.runtimeFiles, volumes,
    importedAt: new Date().toISOString() }, component);
  // Refuse silent replacement of the now-authoritative Google configuration.
  let exists = false;
  try { run(['secrets', 'describe', secret, '--project', PROJECT, '--format=value(name)']); exists = true; }
  catch (error) {
    if (error.code !== 'not_found') {
      const code = ['api_disabled', 'permission_denied', 'authentication_failed', 'quota_exceeded'].includes(error.code) ? error.code : 'command_failed';
      throw new Error(`Runtime import failed at destination_inventory: ${code}`);
    }
  }
  if (exists) {
    const versions = invoke('destination_inventory', ['secrets', 'versions', 'list', secret, '--project', PROJECT, '--limit=1', '--format=value(name)']);
    if (versions) throw new Error('Google configuration already exists; use Google-owned configuration management');
  } else {
    invoke('destination_create', ['secrets', 'create', secret, '--project', PROJECT, '--replication-policy=automatic']);
  }
  invoke('destination_write', ['secrets', 'versions', 'add', secret, '--project', PROJECT, '--data-file=-'], JSON.stringify(config));
  const readback = JSON.parse(invoke('destination_readback', ['secrets', 'versions', 'access', 'latest', '--secret', secret, '--project', PROJECT]));
  if (JSON.stringify(readback) !== JSON.stringify(config)) throw new Error('Google configuration readback mismatch');
  return { component, runtimeKeys: Object.keys(config.runtimeEnvironment).sort(), volumes: config.volumes.length,
    runtimeFiles: Object.keys(config.runtimeFiles).length, configurationOwner: 'Google Secret Manager' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  importRuntimeConfig(process.env.COMPONENT).then(result => console.log(JSON.stringify(result))).catch(error => {
    const known = ['Source connection required for one-time import', 'Complete resolved runtime inventory required', 'Google configuration already exists; use Google-owned configuration management', 'Google configuration readback mismatch', 'Invalid Google runtime configuration', 'Invalid runtime variable', 'Runtime persistence inventory required', 'Configuration exceeds Secret Manager payload limit; split secrets before import'];
    const reason = known.includes(error.message) || /^Runtime import failed at (destination_inventory|destination_create|destination_write|destination_readback): (api_disabled|permission_denied|not_found|authentication_failed|quota_exceeded|command_failed)$/.test(error.message) || /^Source configuration HTTP [0-9]{3}$/.test(error.message) ? error.message : 'unrecognized_response';
    console.error(`Runtime import failed: ${reason}; no deployment or cutover performed`); process.exitCode = 1;
  });
}
