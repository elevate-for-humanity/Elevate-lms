import { pathToFileURL } from 'node:url';
import { google, PROJECT, configSecret, validateConfig } from './runtime-config.mjs';

const SOURCE = 'https://api.northflank.com/v1/projects/elevate-platform';
const GROUPS = ['elevate-production-env', 'elevate-llm-client-env'];
const KEYS = ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_AI_MODEL','AI_GATEWAY_ID'];
export function mergeCloudflareConfig(target, source) {
  const next = structuredClone(target);
  for (const key of KEYS) {
    const value = source[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    const existing = next.runtimeEnvironment[key];
    if (existing && existing !== value) throw new Error('google_cloudflare_config_conflict_' + key);
    next.runtimeEnvironment[key] = value;
  }
  if (!next.runtimeEnvironment.CLOUDFLARE_ACCOUNT_ID ||
      !next.runtimeEnvironment.CLOUDFLARE_AI_API_TOKEN ||
      !next.runtimeEnvironment.CLOUDFLARE_AI_MODEL?.startsWith('@cf/'))
    throw new Error('cloudflare_source_config_incomplete');
  // Migration never switches AI_PROVIDER or launches model workers.
  return validateConfig(next, 'admin');
}
export async function migrateCloudflare({env = process.env, request=fetch, run=google}={}) {
  const secret = configSecret('admin');
  const read = () => run(['secrets','versions','access','latest','--secret',secret,'--project',PROJECT]);
  const original = read();
  const parsed = JSON.parse(original);
  validateConfig(parsed,'admin');
  // Google configuration is authoritative. Do not require the retired
  // Northflank account when the full settings are already present in Google.
  try {
    mergeCloudflareConfig(parsed, {});
    return {status:'already_configured',keys:KEYS.filter(k=>parsed.runtimeEnvironment[k]),runtimeChanged:false,sourceDeleted:false};
  } catch (error) {
    if (error.message !== 'cloudflare_source_config_incomplete') throw error;
  }
  if (!env.NORTHFLANK_API_TOKEN) throw new Error('northflank_read_token_missing');
  const source = {};
  const unavailable = [];
  for (const group of GROUPS) {
    let response;
    try {
      response = await request(SOURCE + '/secrets/' + group + '/details', {
        headers: {Authorization: 'Bearer ' + env.NORTHFLANK_API_TOKEN},
        signal: AbortSignal.timeout(30000),
      });
    } catch { unavailable.push(group); continue; }
    if (!response.ok) { unavailable.push(group); continue; }
    const payload = await response.json().catch(()=>({}));
    const vars = (payload.data ?? payload).secrets?.variables;
    if (!vars || typeof vars !== 'object') { unavailable.push(group); continue; }
    Object.assign(source, vars);
  }
  if (!source.CLOUDFLARE_AI_API_TOKEN && source.CLOUDFLARE_API_TOKEN)
    source.CLOUDFLARE_AI_API_TOKEN = source.CLOUDFLARE_API_TOKEN;
  // Never overwrite existing Google secrets; missing optional Northflank
  // groups are acceptable only if required values are already recoverable.
  const merged = mergeCloudflareConfig(parsed,source);
  const updated = JSON.stringify(merged);
  if (updated === JSON.stringify(parsed))
    return {status:'already_configured',keys:KEYS.filter(k=>merged.runtimeEnvironment[k]),runtimeChanged:false,sourceDeleted:false,unavailableGroups:unavailable};
  if (read() !== original) throw new Error('google_config_changed_concurrently');
  const created = JSON.parse(run(['secrets','versions','add',secret,'--project',PROJECT,'--data-file=-','--format=json'],updated));
  const version = created.name?.split('/').at(-1);
  if (!/^\\d+$/.test(version ?? '') ||
      run(['secrets','versions','access',version,'--secret',secret,'--project',PROJECT]) !== updated)
    throw new Error('google_secret_readback_failed');
  return {status:'transferred',keys:KEYS.filter(k=>merged.runtimeEnvironment[k]),runtimeChanged:false,sourceDeleted:false,unavailableGroups:unavailable};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrateCloudflare().then(result=>console.log(JSON.stringify(result)))
    .catch(error => { console.error('Cloudflare configuration migration failed: ' + String(error.message).replace(/[^A-Za-z0-9_-]/g,'_').slice(0,100)); process.exitCode=1; });
}
