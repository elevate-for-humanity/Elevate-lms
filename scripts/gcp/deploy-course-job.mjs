import { loadGoogleConfig } from './runtime-config.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Select one complete credential family. Never combine a B2 endpoint with
// credentials inherited from a different provider or silently use Supabase.
export function courseB2Environment(vars) {
  const canonical=Boolean(vars.ELEVATE_MEDIA_ENDPOINT);
  const keys=canonical
    ? ['ELEVATE_MEDIA_ENDPOINT','ELEVATE_MEDIA_ACCESS_KEY_ID','ELEVATE_MEDIA_SECRET_ACCESS_KEY','ELEVATE_MEDIA_BUCKET']
    : ['S3_ENDPOINT','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY','S3_BUCKET'];
  if(keys.some(key=>typeof vars[key]!=='string'||!vars[key].trim()))throw Error('COURSE_B2_CONFIGURATION_INCOMPLETE');
  let endpoint,delivery;
  try {
    endpoint=new URL(vars[keys[0]]);
    delivery=new URL(canonical?(vars.ELEVATE_MEDIA_PUBLIC_URL||vars.NEXT_PUBLIC_ELEVATE_MEDIA_URL):vars.S3_PUBLIC_URL);
  } catch {throw Error('COURSE_B2_CONFIGURATION_INVALID');}
  if(endpoint.protocol!=='https:'||!/^s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(endpoint.hostname)||
    endpoint.username||endpoint.password||endpoint.port||endpoint.search||endpoint.hash||endpoint.pathname!=='/'||
    delivery.protocol!=='https:'||delivery.username||delivery.password||delivery.search||delivery.hash)
    throw Error('COURSE_B2_CONFIGURATION_INVALID');
  return {COURSE_VIDEO_STORAGE_BACKEND:'b2',ELEVATE_MEDIA_PROVIDER:'backblaze-b2',
    ELEVATE_MEDIA_ENDPOINT:endpoint.origin,ELEVATE_MEDIA_REGION:endpoint.hostname.split('.')[1],
    ELEVATE_MEDIA_ACCESS_KEY_ID:vars[keys[1]],ELEVATE_MEDIA_SECRET_ACCESS_KEY:vars[keys[2]],
    ELEVATE_MEDIA_BUCKET:vars[keys[3]],ELEVATE_MEDIA_PUBLIC_URL:delivery.href.replace(/\/$/,'')};
}

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
  result.REMOTION_RENDER_CONCURRENCY = '1';
  Object.assign(result,courseB2Environment(vars));
  return result;
}

/** Deployment changes the image, not the approved rendering capacity. */
export function courseJobResources(job) {
  const limits = job?.spec?.template?.spec?.template?.spec?.containers?.[0]?.resources?.limits;
  const cpuMatch = String(limits?.cpu ?? '').match(/^(\d+)(m)?$/);
  const cpu = cpuMatch ? Number(cpuMatch[1]) / (cpuMatch[2] ? 1000 : 1) : NaN;
  const memory = String(limits?.memory ?? '');
  if (!Number.isInteger(cpu) || cpu < 1 || cpu > 8 || !/^\d+(?:Mi|Gi)$/.test(memory))
    throw new Error('Existing worker resource configuration must be inspected before deployment');
  return {cpu:String(cpu),memory};
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
  const before=JSON.parse(gcloud(['run','jobs','describe','elevate-course-builder','--project',project,'--region',region,'--format=json']));
  const resources=courseJobResources(before);
  const digest=gcloud(['artifacts','docker','images','describe',`${image}:${sha}`,'--project',project,'--format=value(image_summary.digest)']);
  if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw new Error('Uploaded worker digest required');
  const directory=mkdtempSync(join(tmpdir(),'elevate-course-job-'));
  try {
    const environment=join(directory,'environment.json');
    writeFileSync(environment,JSON.stringify(vars),{mode:0o600});
    gcloud(['run','jobs','deploy','elevate-course-builder','--project',project,'--region',region,
      '--image',`${image}@${digest}`,'--service-account',`elevate-worker-runtime@${project}.iam.gserviceaccount.com`,
      '--cpu',resources.cpu,'--memory',resources.memory,'--tasks','1','--parallelism','1','--max-retries','1','--task-timeout','10800s',
      '--env-vars-file',environment,'--quiet']);
    const job=JSON.parse(gcloud(['run','jobs','describe','elevate-course-builder','--project',project,'--region',region,'--format=json']));
    const container=job.spec.template.spec.template.spec.containers[0];
    const afterResources=courseJobResources(job);
    if(job.spec.template.spec.template.spec.serviceAccountName!==`elevate-worker-runtime@${project}.iam.gserviceaccount.com` ||
      container.image!==`${image}@${digest}` || afterResources.cpu!==resources.cpu || afterResources.memory!==resources.memory ||
      Number(job.spec.template.spec.parallelism)!==1 || Number(job.spec.template.spec.taskCount)!==1 ||
      Number(job.spec.template.spec.template.spec.maxRetries)!==1 ||
      !container.env.some(v=>v.name==='ULTIMATE_WORKER_ONCE'&&v.value==='true'))
      throw new Error('Worker deployment readback mismatch');
    console.log('Finite Course Builder job deployed. No execution or queue mutation performed.');
  } finally {rmSync(directory,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
