import { pathToFileURL } from 'node:url';
import { google, loadGoogleConfig, PROJECT } from './runtime-config.mjs';
import { diagnoseAccess } from './diagnose-access.mjs';

export async function verifyOwnedModel(env, { request = fetch } = {}) {
  const base = env.ELEVATE_LLM_URL?.trim().replace(/\/+$/, '');
  const secret = env.ELEVATE_LLM_SECRET?.trim();
  if (!base || !secret) return { configured:false, verified:false, status:'not_configured' };
  let url;
  try { url = new URL(base); } catch { return { configured:true, verified:false, status:'invalid_endpoint' }; }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.run.app') || url.username || url.password || url.search || url.hash) {
    return { configured:true, verified:false, status:'google_endpoint_required' };
  }
  try {
    const response = await request(base+'/v1/models', {
      redirect:'manual', headers:{Authorization:`Bearer ${secret}`}, signal:AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(()=>({}));
    const verified = response.ok && Array.isArray(body.data) && body.data.some(model=>model?.id==='elevate-local');
    return { configured:true, verified, status:verified?'reachable':response.status===401||response.status===403?'authentication_failed':'model_unavailable', httpStatus:response.status };
  } catch { return { configured:true, verified:false, status:'request_failed' }; }
}

export function classifyRuntimeErrors(entries) {
  return entries.map(entry => {
    const text=JSON.stringify(entry.textPayload??entry.jsonPayload??'');
    const category=/diagnostic-only/.test(text)?'diagnostic_narration_config':
      /Cannot find module|Module not found|Could not resolve/.test(text)?'missing_runtime_dependency':
      /Kokoro|kokoro|onnx|ONNX/.test(text)?'owned_narration_runtime':
      /Remotion|remotion|render/.test(text)?'media_render':
      /download|fetch failed|ETIMEDOUT/.test(text)?'network_or_download':
      /permission|PERMISSION_DENIED/i.test(text)?'permission_denied':'application_error';
    return { category, timestamp: /^\d{4}-\d{2}-\d{2}T/.test(entry.timestamp??'')?entry.timestamp:undefined };
  });
}

async function main() {
  const region='us-central1';
  const services=JSON.parse(google(['run','services','list','--project',PROJECT,'--region',region,'--format=json']));
  const admin=loadGoogleConfig('admin');
  const browser=loadGoogleConfig('studio-browser');
  const ownedModel=await verifyOwnedModel(admin.runtimeEnvironment);
  const report={ observedAt:new Date().toISOString(), project:PROJECT, region,
    services:services.map(service=>({name:service.metadata?.name, revision:service.status?.latestReadyRevisionName})),
    ownedModel,
    studio:{ configured:Boolean(admin.runtimeEnvironment.STUDIO_BROWSER_URL), persistentVolumes:browser.volumes.length, stateTransferVerified:false },
    runtimeErrors:[], failures:[],
  };
  try {
    const instances=JSON.parse(google(['compute','instances','list','--project',PROJECT,'--filter=name=elevate-studio-browser','--format=json']));
    report.studio.googleInstancePresent=instances.length===1;
  } catch { report.failures.push('studio_instance_inventory_unavailable'); }
  try {
    const resource=JSON.parse(google(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region',region,'--format=json']));
    const container=resource.spec?.template?.spec?.containers?.[0];
    const narration=container?.env?.find(item=>item.name==='AI_NARRATION_PROVIDER')?.value;
    report.admin={revision:resource.status?.latestReadyRevisionName,narrationProvider:['kokoro','local'].includes(narration)?narration:'other_or_unset'};
  } catch { report.failures.push('admin_configuration_readback_unavailable'); }
  try {
    const entries=JSON.parse(google(['logging','read','resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-admin-migration" AND severity>=ERROR','--project',PROJECT,'--freshness=20m','--limit=15','--format=json']));
    report.runtimeErrors=classifyRuntimeErrors(entries);
  } catch { report.failures.push('admin_error_logs_unavailable'); }
  report.access=await diagnoseAccess(google(['auth','print-access-token']));
  console.log(JSON.stringify(report,null,2));
  if(!ownedModel.verified || !report.studio.googleInstancePresent || report.failures.length) process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error('Google AI runtime verification failed: '+(error.code??'read_failed'));process.exitCode=1;});
