import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

export function runtimeForGoogle(source, service) {
  if (Object.keys(source.runtimeFiles ?? {}).length) throw new Error('Runtime files require a separate migration');
  if ((service.deployment?.volumes ?? service.volumes ?? []).length) throw new Error('Persistent volumes require a separate migration');
  const vars = source.runtimeEnvironment;
  if (!vars || typeof vars !== 'object' || Array.isArray(vars)) throw new Error('Runtime environment unavailable');
  if (vars.NEXT_PUBLIC_SUPABASE_URL !== 'https://cuxzzpsyufcewtmicszk.supabase.co') throw new Error('Unexpected Supabase project');
  if (!vars.NEXT_PUBLIC_SUPABASE_ANON_KEY || !vars.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Required runtime credentials missing');
  const result = {};
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value !== 'string') throw new Error('Non-string runtime variable');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error('Unsupported environment variable name');
    // Cloud Run injects these container metadata variables itself.
    if (['PORT', 'K_SERVICE', 'K_REVISION', 'K_CONFIGURATION'].includes(key) || key.startsWith('X_GOOGLE_')) continue;
    if (/\$\{[^}]+\}/.test(value)) throw new Error('Unresolved runtime template');
    result[key] = value;
  }
  result.HOSTNAME = '0.0.0.0';
  return result;
}

async function main() {
  const component = process.env.COMPONENT;
  const sha = process.env.IMAGE_SHA;
  if (!['marketing', 'admin', 'lms'].includes(component) || !/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Invalid component or image SHA');
  const token = process.env.NORTHFLANK_API_TOKEN;
  if (!token) throw new Error('Northflank connection missing');
  const project = encodeURIComponent(process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform');
  const base = `https://api.northflank.com/v1/projects/${project}/services/elevate-${component}`;
  async function get(url) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Source configuration returned HTTP ${response.status}`);
    let json;
    try { json = await response.json(); } catch { throw new Error('Source configuration returned invalid JSON'); }
    return json.data ?? json;
  }
  const service = await get(base);
  // Compatibility endpoint explicitly resolves inherited secret groups/templates.
  const source = await get(`${base}/runtime-environment?show=all&replaceTemplatedValues=true`);
  const vars = runtimeForGoogle(source, service);
  const dir = mkdtempSync(join(tmpdir(), 'elevate-runtime-'));
  function gcloud(args) {
    const result = spawnSync('gcloud', args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    // Never print raw CLI errors: they can contain submitted runtime values.
    if (result.status !== 0) throw new Error(`Google operation failed (${args.slice(0, 3).join(' ')}); inspect Google Cloud for details`);
    return result.stdout.trim();
  }
  try {
    const envFile = join(dir, 'environment.json');
    writeFileSync(envFile, JSON.stringify(vars), { mode: 0o600 });
    const projectId = 'elegant-racer-299721';
    const image = `us-central1-docker.pkg.dev/${projectId}/elevate/${component}`;
    const digest = gcloud(['artifacts', 'docker', 'images', 'describe', `${image}:${sha}`, '--project', projectId, '--format=value(image_summary.digest)']);
    if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Image digest unavailable');
    const name = `elevate-${component}-migration`;
    const existing = gcloud(['run', 'services', 'list', '--project', projectId, '--region', 'us-central1', `--filter=metadata.name=${name}`, '--format=value(metadata.name)']);
    if (existing) throw new Error('Migration service already exists; review its revision and IAM before updating');
    gcloud(['run', 'deploy', name, '--project', projectId, '--region', 'us-central1', '--image', `${image}@${digest}`, '--service-account', `elevate-${component}-runtime@${projectId}.iam.gserviceaccount.com`, '--port', '3000', '--cpu', '4', '--memory', '16Gi', '--min-instances', '0', '--max-instances', '2', '--concurrency', '20', '--timeout', '300', '--env-vars-file', envFile, '--quiet']);
    const url = gcloud(['run', 'services', 'describe', name, '--project', projectId, '--region', 'us-central1', '--format=value(status.url)']);
    if (!/^https:\/\/[a-z0-9.-]+\.run\.app$/.test(url)) throw new Error('Unexpected service URL');
    const summary = `Private ${component} service deployed: ${url}\nImage: ${image}@${digest}\nPublic IAM, application health, dependencies and DNS cutover remain unverified.\n`;
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
