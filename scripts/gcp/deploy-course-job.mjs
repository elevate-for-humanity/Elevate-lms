import { loadGoogleConfig } from './runtime-config.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function courseJobEnvironment(source, service) {
  if (Object.keys(source.runtimeFiles ?? {}).length || (service.deployment?.volumes ?? service.volumes ?? []).length)
    throw new Error('Worker files or volumes require explicit migration');
  const vars = source.runtimeEnvironment;
  if (!vars || vars.NEXT_PUBLIC_SUPABASE_URL !== 'https://cuxzzpsyufcewtmicszk.supabase.co' || !vars.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Worker Supabase configuration unavailable or unexpected');
  const result = {};
  for (const [key, value] of Object.entries(vars)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string' || /\$\{[^}]+\}/.test(value))
      throw new Error('Unsupported worker environment');
    if (['PORT','K_SERVICE','K_REVISION','K_CONFIGURATION','ULTIMATE_WORKER_ID'].includes(key) || key.startsWith('X_GOOGLE_')) continue;
    result[key] = value;
  }
  result.NODE_ENV = 'production';
  result.ULTIMATE_WORKER_ONCE = 'true';
  result.AI_PROVIDER = 'none';
  result.AI_NARRATION_PROVIDER = 'kokoro';
  result.AI_TRANSCRIPTION_PROVIDER = 'local_whisper';
  return result;
}

async function main() {
  const sha = process.env.IMAGE_SHA;
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Full worker image commit required');
  const config = loadGoogleConfig('ultimate-worker');
  const vars = courseJobEnvironment(config, { volumes: config.volumes });
  const project='elegant-racer-299721', region='us-central1';
  function gcloud(args) {
    const r=spawnSync('gcloud',args,{encoding:'utf8',maxBuffer:4*1024*1024});
    if(r.status!==0)throw new Error(`Google worker operation failed: ${args.slice(0,3).join(' ')}`);
    return r.stdout.trim();
  }
  const image=`us-central1-docker.pkg.dev/${project}/elevate/ultimate-worker`;
  const digest=gcloud(['artifacts','docker','images','describe',`${image}:${sha}`,'--project',project,'--format=value(image_summary.digest)']);
  if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw new Error('Uploaded worker digest required');
  const directory=mkdtempSync(join(tmpdir(),'elevate-course-job-'));
  try {
    const environment=join(directory,'environment.json');
    writeFileSync(environment,JSON.stringify(vars),{mode:0o600});
    gcloud(['run','jobs','deploy','elevate-course-builder','--project',project,'--region',region,
      '--image',`${image}@${digest}`,'--service-account',`elevate-admin-runtime@${project}.iam.gserviceaccount.com`,
      '--cpu','4','--memory','8Gi','--tasks','1','--parallelism','1','--max-retries','0','--task-timeout','3600s',
      '--env-vars-file',environment,'--quiet']);
    const job=JSON.parse(gcloud(['run','jobs','describe','elevate-course-builder','--project',project,'--region',region,'--format=json']));
    const container=job.spec.template.spec.template.spec.containers[0];
    if(container.image!==`${image}@${digest}` || !container.env.some(v=>v.name==='ULTIMATE_WORKER_ONCE'&&v.value==='true'))
      throw new Error('Worker deployment readback mismatch');
    console.log('Finite Course Builder job deployed. No execution or queue mutation performed.');
  } finally {rmSync(directory,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
