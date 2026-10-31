import { pathToFileURL } from 'node:url';
import { google, loadGoogleConfig, PROJECT, COMPONENTS } from './runtime-config.mjs';
import { inspectRegionalCapacity } from './regional-capacity.mjs';
import { resolveOwnedModelConnection } from '../../lib/ai/providers/owned-model-config.mjs';
import { diagnoseAccess } from './diagnose-access.mjs';

import { probeOwnedModel } from '../../lib/ai/providers/owned-model-health.mjs';

export async function verifyOwnedModel(env, options={}) {
  return probeOwnedModel({env, ...options});
}

/** Report binding presence only; never serialize endpoint or credential values. */
export function consumerModelBindings(resource) {
  const entries=resource?.spec?.containers?.[0]?.env ?? resource?.spec?.template?.spec?.containers?.[0]?.env ?? [];
  const entry=name=>entries.find(item=>item.name===name);
  const present=name=>Boolean(entry(name)?.value || entry(name)?.valueFrom);
  return {endpointPresent:present('ELEVATE_LLM_URL'),cpuEndpointPresent:present('ELEVATE_LLM_CPU_URL'),
    applicationTokenPresent:present('ELEVATE_LLM_SECRET'),cpuTokenPresent:present('ELEVATE_LLM_CPU_SECRET'),
    privateGoogleInvocation:entry('ELEVATE_LLM_GOOGLE_IAM')?.value==='true'};
}

/** Read-only permission check for this exact private model service. */
export async function inspectModelServicePermissions(accessToken,{request=fetch}={}) {
  try {
    const response=await request(`https://run.googleapis.com/v2/projects/${PROJECT}/locations/us-east1/services/elevate-owned-cpu-llm:testIamPermissions`,{
      method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},
      body:JSON.stringify({permissions:['run.services.setIamPolicy','run.routes.invoke']}),signal:AbortSignal.timeout(15000),
    });
    const body=await response.json().catch(()=>({}));
    return {verified:response.ok,canManageInvocation:response.ok&&body.permissions?.includes('run.services.setIamPolicy')===true,
      canInvoke:response.ok&&body.permissions?.includes('run.routes.invoke')===true,httpStatus:response.status};
  } catch {return {verified:false,status:'permission_check_unavailable'};}
}

export function classifyRuntimeErrors(entries) {
  return entries.map(entry => {
    const text=JSON.stringify(entry.textPayload??entry.jsonPayload??'');
    const category=/MODEL_BOUNDED_EIGHT_GIB_MEMORY_REQUIRED/.test(text)?'model_memory_boundary':
      /MODEL_CHECKSUM_FAILED/.test(text)?'model_checksum':
      /MODEL_AUTHENTICATION_CONFIGURATION_REQUIRED/.test(text)?'model_authentication_configuration':
      /diagnostic-only/.test(text)?'diagnostic_narration_config':
      /Cannot find module|Module not found|Could not resolve/.test(text)?'missing_runtime_dependency':
      /Kokoro|kokoro|onnx|ONNX/.test(text)?'owned_narration_runtime':
      /Remotion|remotion|render/.test(text)?'media_render':
      /download|fetch failed|ETIMEDOUT/.test(text)?'network_or_download':
      /permission|PERMISSION_DENIED/i.test(text)?'permission_denied':'application_error';
    return { category, timestamp: /^\d{4}-\d{2}-\d{2}T/.test(entry.timestamp??'')?entry.timestamp:undefined };
  });
}

export function isReadyStudioCloudRun(service) {
  if (service?.metadata?.name !== 'elevate-studio-browser' ||
      !service.status?.conditions?.some(condition => condition.type === 'Ready' && condition.status === 'True')) return false;
  try {
    const url = new URL(service.status.url);
    return url.protocol === 'https:' && url.hostname.endsWith('.run.app') && !url.username && !url.password;
  } catch { return false; }
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
  // Read-only release evidence. Never create identities, grant permissions,
  // start compute, or expose model credentials from diagnostics.
  report.modelConsumers = COMPONENTS.map(component => {
    try {
      const env = loadGoogleConfig(component).runtimeEnvironment;
      const connection = resolveOwnedModelConnection(env);
      return {component, configured:connection.configured, endpointAccepted:Boolean(connection.base), tier:connection.tier,
        cpuEndpointPresent:Boolean(env.ELEVATE_LLM_CPU_URL), privateGoogleInvocation:env.ELEVATE_LLM_GOOGLE_IAM==='true', provider:env.AI_PROVIDER || 'unset',
        ...(['admin','marketing'].includes(component)?{deployedBindings:consumerModelBindings(services.find(service=>service.metadata?.name===`elevate-${component}-migration`))}:{})};
    } catch(error) { return {component, status:error.code || 'configuration_unavailable'}; }
  });
  const modelIdentity = `elevate-llm-runtime@${PROJECT}.iam.gserviceaccount.com`;
  report.cpuReleasePrerequisites = {};
  try {
    google(['iam','service-accounts','describe',modelIdentity,'--project',PROJECT,'--format=value(email)']);
    report.cpuReleasePrerequisites.identityPresent = true;
  } catch(error) { report.cpuReleasePrerequisites.identityStatus = error.code || 'unavailable'; }
  try {
    const policy = JSON.parse(google(['secrets','get-iam-policy','elevate-owned-llm-token','--project',PROJECT,'--format=json']));
    report.cpuReleasePrerequisites.scopedModelSecretReader = Boolean(policy.bindings?.some(binding => binding.role==='roles/secretmanager.secretAccessor' && binding.members?.includes('serviceAccount:'+modelIdentity)));
  } catch(error) { report.cpuReleasePrerequisites.secretReaderStatus = error.code || 'unavailable'; }
  try {
    const cpuServices = JSON.parse(google(['run','services','list','--project',PROJECT,'--region','us-east1','--format=json']));
    const cpuService = cpuServices.find(service => service.metadata?.name==='elevate-owned-cpu-llm');
    report.cpuReleasePrerequisites.existingCpuService = Boolean(cpuService);
    if (cpuService) {
      const container=cpuService.spec?.template?.spec?.containers?.[0];
      report.cpuReleasePrerequisites.service={
        revision:cpuService.status?.latestCreatedRevisionName,
        readyRevision:cpuService.status?.latestReadyRevisionName,
        conditions:cpuService.status?.conditions?.map(condition=>({type:condition.type,status:condition.status,reason:condition.reason})),
        cpu:container?.resources?.limits?.cpu,memory:container?.resources?.limits?.memory,
        imageDigest:container?.image?.match(/sha256:[a-f0-9]{64}/)?.[0],
      };
      const policy=JSON.parse(google(['run','services','get-iam-policy','elevate-owned-cpu-llm','--project',PROJECT,'--region','us-east1','--format=json']));
      const invokers=(policy.bindings??[]).filter(binding=>binding.role==='roles/run.invoker'&&!binding.condition).flatMap(binding=>binding.members??[]);
      const consumerIdentities=services.filter(service=>['elevate-admin-migration','elevate-marketing-migration'].includes(service.metadata?.name)).map(service=>service.spec?.template?.spec?.serviceAccountName);
      const required=[...new Set([`elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`,...consumerIdentities].filter(Boolean))];
      report.cpuReleasePrerequisites.deploymentPermissions=await inspectModelServicePermissions(google(['auth','print-access-token']));
      report.cpuReleasePrerequisites.invocation={
        private:!(policy.bindings??[]).some(binding=>binding.members?.some(member=>['allUsers','allAuthenticatedUsers'].includes(member))),
        requiredInvokers:required,principalsWithoutServiceBinding:required.filter(identity=>!invokers.includes('serviceAccount:'+identity)),
      };
      try {
        const entries=JSON.parse(google(['logging','read','resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-owned-cpu-llm"','--project',PROJECT,'--freshness=20m','--limit=10','--format=json']));
        report.cpuReleasePrerequisites.recentLogCategories=classifyRuntimeErrors(entries).map(entry=>({...entry,category:entry.category==='application_error'?'model_runtime_log':entry.category}));
      } catch(error) { report.cpuReleasePrerequisites.modelLogsStatus=error.code||'unavailable'; }
    }
    report.cpuReleasePrerequisites.capacity = await inspectRegionalCapacity({region:'us-east1',task:{containers:[{resources:{limits:{cpu:'4',memory:'8Gi'}}}]}});
  } catch(error) { report.cpuReleasePrerequisites.capacityStatus = error.code || 'unavailable'; }
  try {
    const instances=JSON.parse(google(['compute','instances','list','--project',PROJECT,'--filter=name=elevate-studio-browser','--format=json']));
    report.studio.googleInstancePresent=instances.some(instance=>instance.name==='elevate-studio-browser' && instance.status==='RUNNING');
  } catch { report.failures.push('studio_instance_inventory_unavailable'); }
  report.studio.googleCloudRunReady=services.some(isReadyStudioCloudRun);
  report.studio.googleRuntimeReady=report.studio.googleCloudRunReady || report.studio.googleInstancePresent===true;
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
  try {
    const entries=JSON.parse(google(['logging','read','resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-marketing-migration" AND severity>=ERROR','--project',PROJECT,'--freshness=20m','--limit=15','--format=json']));
    report.marketingRuntimeErrors=classifyRuntimeErrors(entries);
  } catch { report.failures.push('marketing_error_logs_unavailable'); }
  try {
    const policy=JSON.parse(google(['projects','get-iam-policy',PROJECT,'--format=json']));
    let accounts;
    try { accounts=JSON.parse(google(['iam','service-accounts','list','--project',PROJECT,'--format=json'])); report.identityInventoryComplete=true; }
    catch {
      const members=(policy.bindings??[]).flatMap(binding=>binding.members??[]).filter(member=>member.startsWith('serviceAccount:')).map(member=>member.slice(15));
      const deployed=services.map(service=>service.spec?.template?.spec?.serviceAccountName).filter(Boolean);
      accounts=[...new Set([...members,...deployed])].filter(email=>email.endsWith('@'+PROJECT+'.iam.gserviceaccount.com')).map(email=>({email}));
      report.identityInventoryComplete=false;
    }
    report.runtimeIdentities=accounts.filter(account=>!account.disabled).map(account=>({
      email:account.email,
      dedicatedModelCandidate:/elevate-(?:llm|model|gpu)(?:-|@)/.test(account.email??''),
      projectRoles:(policy.bindings??[]).filter(binding=>binding.members?.includes('serviceAccount:'+account.email)).map(binding=>binding.role),
    }));
  } catch(error) { report.identityInventoryStatus=error.code??'read_failed'; }
  report.access=await diagnoseAccess(google(['auth','print-access-token']));
  console.log(JSON.stringify(report,null,2));
  if(!ownedModel.verified || !report.studio.googleRuntimeReady || report.failures.length) process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error('Google AI runtime verification failed: '+(error.code??'read_failed'));process.exitCode=1;});
