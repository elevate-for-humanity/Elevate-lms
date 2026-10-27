import { pathToFileURL } from 'node:url';
import { google, loadGoogleConfig, PROJECT } from './runtime-config.mjs';

const REGION='us-central1';
const SERVICE='elevate-owned-llm';
const SECRET='elevate-owned-llm-token';
const IDENTITY=`elevate-llm-runtime@${PROJECT}.iam.gserviceaccount.com`;
function ensureSecretReader(member){
  const policy=JSON.parse(google(['secrets','get-iam-policy',SECRET,'--project',PROJECT,'--format=json']));
  if(policy.bindings?.some(binding=>binding.role==='roles/secretmanager.secretAccessor'&&!binding.condition&&binding.members?.includes(member)))return;
  google(['secrets','add-iam-policy-binding',SECRET,'--project',PROJECT,`--member=${member}`,'--role=roles/secretmanager.secretAccessor','--condition=None','--quiet']);
}

export function modelCredential(config) {
  const candidates=[config.runtimeEnvironment.ELEVATE_LLM_SECRET];
  for(const group of config.sourceSecretGroupArchive?.groups??[]) {
    if(group.project==='elevate-media-gpu'&&group.sourceGroup==='elevate-llm-worker-env')
      candidates.push(group.secrets?.variables?.LLM_WORKER_SECRET);
  }
  const values=[...new Set(candidates.filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()))];
  if(values.length!==1||values[0].length<24) throw new Error('owned_model_credential_unverified');
  return values[0];
}
export function deploymentArguments(digest) {
  if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw new Error('immutable_model_image_required');
  return ['run','deploy',SERVICE,'--project',PROJECT,'--region',REGION,
    '--image',`us-central1-docker.pkg.dev/${PROJECT}/elevate/owned-llm@${digest}`,
    '--service-account',IDENTITY,'--port','8080','--gpu','1','--gpu-type','nvidia-l4',
    '--no-gpu-zonal-redundancy','--cpu','8','--memory','32Gi','--min-instances','0','--max-instances','1',
    '--concurrency','8','--timeout','900s','--no-cpu-throttling',
    '--startup-probe','httpGet.path=/health,httpGet.port=8080,periodSeconds=10,timeoutSeconds=5,failureThreshold=120',
    '--set-secrets',`LLM_WORKER_SECRET=${SECRET}:latest`,
    '--allow-unauthenticated','--quiet'];
}
export async function acceptOwnedModel(url, token, {request=fetch}={}) {
  const endpoint=new URL(url);
  if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.run.app')||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)
    throw new Error('google_model_endpoint_required');
  async function call(path,body,authorized=true){
    const response=await request(url+path,{method:body?'POST':'GET',redirect:'manual',
      headers:{...(authorized?{Authorization:`Bearer ${token}`} : {}),'Content-Type':'application/json'},
      body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(900000)});
    const payload=await response.json().catch(()=>({}));return {response,payload};
  }
  const denied=await call('/v1/models',undefined,false);
  if(denied.response.status!==401)throw new Error('model_bearer_authentication_not_enforced');
  const listed=await call('/v1/models');
  if(!listed.response.ok||!listed.payload.data?.some(row=>row.id==='elevate-local'))throw new Error('owned_model_catalog_unverified');
  const completion=await call('/v1/chat/completions',{model:'elevate-local',messages:[{role:'user',content:'What is 2 plus 2? Answer with the number only.'}],temperature:0,max_tokens:16});
  if(!completion.response.ok||!/^\s*4[.\s]*$/.test(completion.payload.choices?.[0]?.message?.content??''))throw new Error('owned_model_inference_unverified');
  const tool=await call('/v1/chat/completions',{model:'elevate-local',messages:[{role:'user',content:'Use the supplied addition function to add 2 and 2.'}],temperature:0,max_tokens:128,
    tools:[{type:'function',function:{name:'add_numbers',description:'Add two numbers',parameters:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b'],additionalProperties:false}}}],
    tool_choice:{type:'function',function:{name:'add_numbers'}}});
  const fn=tool.payload.choices?.[0]?.message?.tool_calls?.[0]?.function;
  let argumentsValue;try{argumentsValue=JSON.parse(fn?.arguments??'');}catch{}
  if(!tool.response.ok||fn?.name!=='add_numbers'||argumentsValue?.a!==2||argumentsValue?.b!==2)throw new Error('owned_model_tool_call_unverified');
  const streamed=await request(url+'/v1/chat/completions',{method:'POST',redirect:'manual',
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:'elevate-local',messages:[{role:'user',content:'Say hello in one short sentence.'}],temperature:0,max_tokens:32,stream:true}),signal:AbortSignal.timeout(900000)});
  if(!streamed.ok||!streamed.headers.get('content-type')?.includes('text/event-stream')||!streamed.body)
    throw new Error('owned_model_stream_unverified');
  const reader=streamed.body.getReader();const decoder=new TextDecoder();let pending='',tokens=0,done=false;
  try{
    while(!done){const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});
      if(pending.length>1048576)throw new Error('owned_model_stream_oversized');
      let end;while((end=pending.indexOf('\n\n'))>=0){
        const frame=pending.slice(0,end);pending=pending.slice(end+2);
        const data=frame.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
        if(data==='[DONE]'){done=true;break;}if(!data)continue;
        const event=JSON.parse(data);if(event.error)throw new Error('owned_model_stream_error');
        if(event.choices?.[0]?.delta?.content)tokens++;
      }
    }
    if(!done||tokens===0)throw new Error('owned_model_stream_truncated');
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  return {authenticationVerified:true,catalogVerified:true,inferenceVerified:true,toolCallsVerified:true,streamingVerified:true};
}

async function main(){
  if(!/^[a-f0-9]{40}$/.test(process.env.IMAGE_SHA??''))throw new Error('model_image_commit_required');
  const admin=loadGoogleConfig('admin');
  const token=modelCredential(admin);
  // Only this model token is exposed to the model runtime. Supabase and the
  // full configuration archives remain inaccessible to the model container.
  try{google(['iam','service-accounts','describe',IDENTITY,'--project',PROJECT,'--format=value(email)']);}
  catch(error){if(error.code!=='not_found')throw error;
    google(['iam','service-accounts','create','elevate-llm-runtime','--project',PROJECT,'--display-name=Elevate owned model runtime','--quiet']);}
  const accessToken=google(['auth','print-access-token']);
  const check=await fetch(`https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts/${IDENTITY}:testIamPermissions`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({permissions:['iam.serviceAccounts.actAs']}),signal:AbortSignal.timeout(30000)});
  const permissions=await check.json();
  if(!check.ok||!permissions.permissions?.includes('iam.serviceAccounts.actAs'))
  google(['iam','service-accounts','add-iam-policy-binding',IDENTITY,'--project',PROJECT,
    `--member=serviceAccount:elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`,'--role=roles/iam.serviceAccountUser','--condition=None','--quiet']);
  try{google(['secrets','describe',SECRET,'--project',PROJECT,'--format=value(name)']);}
  catch(error){if(error.code!=='not_found')throw error;google(['secrets','create',SECRET,'--project',PROJECT,'--replication-policy=automatic']);}
  const versions=google(['secrets','versions','list',SECRET,'--project',PROJECT,'--limit=1','--format=value(name)']);
  if(versions){if(google(['secrets','versions','access','latest','--secret',SECRET,'--project',PROJECT])!==token)throw new Error('existing_model_token_differs');}
  else google(['secrets','versions','add',SECRET,'--project',PROJECT,'--data-file=-'],token);
  ensureSecretReader(`serviceAccount:${IDENTITY}`);
  if(process.env.PREPARE_ONLY==='true'){console.log(JSON.stringify({dedicatedModelIdentityPrepared:true,scopedModelSecretPrepared:true,computeActivated:false}));return;}
  const image=`us-central1-docker.pkg.dev/${PROJECT}/elevate/owned-llm:${process.env.IMAGE_SHA}`;
  const digest=google(['artifacts','docker','images','describe',image,'--project',PROJECT,'--format=value(image_summary.digest)']);
  google(deploymentArguments(digest));
  const resource=JSON.parse(google(['run','services','describe',SERVICE,'--project',PROJECT,'--region',REGION,'--format=json']));
  const url=resource.status?.url;
  const acceptance=await acceptOwnedModel(url,token);
  // Do not reroute clients until authenticated model inference and tool calls pass.
  const current=loadGoogleConfig('admin');
  if(JSON.stringify(current)!==JSON.stringify(admin))throw new Error('google_configuration_changed_concurrently');
  const next={...admin,runtimeEnvironment:{...admin.runtimeEnvironment,ELEVATE_LLM_URL:url,ELEVATE_LLM_SECRET:token}};
  const payload=JSON.stringify(next);
  if(Buffer.byteLength(payload)>65536)throw new Error('runtime_config_requires_split');
  const added=JSON.parse(google(['secrets','versions','add','elevate-admin-runtime-config','--project',PROJECT,'--data-file=-','--format=json'],payload));
  const version=added.name?.split('/').at(-1);
  if(!/^\d+$/.test(version??'')||google(['secrets','versions','access',version,'--secret','elevate-admin-runtime-config','--project',PROJECT])!==payload)
    throw new Error('model_client_configuration_readback_failed');
  const liveAdmin=JSON.parse(google(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region',REGION,'--format=json']));
  const adminIdentity=liveAdmin.spec?.template?.spec?.serviceAccountName;
  if(!/^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/.test(adminIdentity??''))throw new Error('admin_runtime_identity_unverified');
  ensureSecretReader(`serviceAccount:${adminIdentity}`);
  // Replace the old environment binding with a scoped Secret Manager reference.
  google(['run','services','update','elevate-admin-migration','--project',PROJECT,'--region',REGION,
    `--update-env-vars=ELEVATE_LLM_URL=${url}`,'--remove-env-vars=ELEVATE_LLM_SECRET',`--update-secrets=ELEVATE_LLM_SECRET=${SECRET}:latest`,'--quiet']);
  console.log(JSON.stringify({service:SERVICE,revision:resource.status?.latestReadyRevisionName,imageDigest:digest,minInstances:0,maxInstances:1,...acceptance,adminConnectionUpdated:true}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error(JSON.stringify({operation:'deploy_owned_llm',code:error.code??error.message,detail:error.message}));process.exitCode=1;});
