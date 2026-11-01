import {pathToFileURL} from 'node:url';
import {google,PROJECT,loadGoogleConfig,validateConfig} from './runtime-config.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
const SERVICE='elevate-admin-migration', SECRET='elevate-admin-github-token';
const CONFIG='elevate-admin-runtime-config', BASE='https://cuxzzpsyufcewtmicszk.supabase.co';
const REPO='https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main';
const failure=code=>{throw Error(code);};
export async function syncAdminGitHubToken({run=google,request=fetch,config=()=>loadGoogleConfig('admin',run),activate=activateTestedRevision,apply=false}={}){
 const before=config();validateConfig(before,'admin');
 const env=before.runtimeEnvironment;
 if((env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL)?.replace(/\/$/,'')!==BASE||!env.SUPABASE_SERVICE_ROLE_KEY)failure('ADMIN_GITHUB_SOURCE_NOT_VERIFIED');
 const response=await request(BASE+'/rest/v1/rpc/get_platform_secret',{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_key:'GITHUB_TOKEN'}),redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok)failure('ADMIN_GITHUB_SOURCE_READ_FAILED');
 const token=await response.json();
 if(typeof token!=='string'||!token.trim()||!/^(github_pat_|ghp_)/.test(token.trim()))failure('ADMIN_GITHUB_TOKEN_FORMAT_INVALID');
 const check=await request(REPO,{headers:{Authorization:'Bearer '+token.trim(),Accept:'application/vnd.github+json'},redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!check.ok)failure('ADMIN_GITHUB_TOKEN_REJECTED');
 const read=args=>JSON.parse(run([...args,'--project='+PROJECT,'--format=json']));
 const state=read(['run','services','describe',SERVICE,'--region=us-central1']);
 const traffic=(state.status?.traffic||[]).filter(t=>t.percent>0);
 if(traffic.length!==1||traffic[0].percent!==100||state.status?.latestReadyRevisionName!==traffic[0].revisionName||state.status?.latestCreatedRevisionName!==traffic[0].revisionName)failure('ADMIN_GITHUB_RUNTIME_NOT_STABLE');
 const image=state.spec?.template?.spec?.containers?.[0]?.image;
 if(!/@sha256:[a-f0-9]{64}$/.test(image||''))failure('ADMIN_GITHUB_IMAGE_NOT_PINNED');
 const health=await request('https://admin.elevateforhumanity.org/api/health',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
 const body=health.ok?await health.json():{};
 if(body.service!=='admin'||body.healthy!==true||body.revision!==traffic[0].revisionName||!/^[a-f0-9]{40}$/.test(body.commit||''))failure('ADMIN_GITHUB_HEALTH_NOT_VERIFIED');
 const metadata=read(['secrets','describe',SECRET]);
 if(metadata.labels?.elevate_component!=='admin'||metadata.labels?.elevate_key!=='github_token')failure('ADMIN_GITHUB_SECRET_OWNER_MISMATCH');
 const evidence={source:'admin-encrypted-platform-secrets:GITHUB_TOKEN',destination:SECRET,key:'GITHUB_TOKEN',repositoryHttp:check.status,appSigningKeyChanged:false};
 if(apply){
 // Repository reads do not establish Actions write. Prove dispatch before storing
 // a replacement; never persist a short-lived Actions/installation token.
 const dispatch=await request('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/verify-paris-credential-storage.yml/dispatches',{
  method:'POST',headers:{Authorization:'Bearer '+token.trim(),Accept:'application/vnd.github+json','Content-Type':'application/json'},
  body:JSON.stringify({ref:'main'}),redirect:'error',signal:AbortSignal.timeout(15000)});
 if(dispatch.status!==204)failure('ADMIN_GITHUB_WORKFLOW_DISPATCH_REJECTED');
 evidence.workflowDispatchVerified=true;
 }
 const existingBinding=state.spec.template.spec.containers[0].env?.find(e=>e.name==='GITHUB_TOKEN')?.valueFrom?.secretKeyRef;
 if(env.GITHUB_TOKEN?.trim()===token.trim()&&existingBinding?.name===SECRET&&/^[1-9][0-9]*$/.test(String(existingBinding.key))){
  const stored=run(['secrets','versions','access',String(existingBinding.key),'--secret',SECRET,'--project='+PROJECT]);
  if(stored.trim()===token.trim())return {...evidence,stateChanged:false,alreadySynchronized:true,workflowDispatchVerified:apply,revision:body.revision,secretVersion:String(existingBinding.key)};
 }
 if(!apply)return {...evidence,stateChanged:false,workflowDispatchVerified:false};
 const add=(name,value)=>{
  try{return readVersion(run(['secrets','versions','add',name,'--project='+PROJECT,'--data-file=-','--format=json(name,state)'],value),name);}
  catch(error){error.phase=name===SECRET?'token-secret-write':'runtime-config-write';throw error;}
 };
 const version=add(SECRET,token.trim());
 if(JSON.stringify(config())!==JSON.stringify(before))failure('ADMIN_GITHUB_CONFIG_CHANGED_CONCURRENTLY');
 const next={...before,runtimeEnvironment:{...env,GITHUB_TOKEN:token.trim()}};validateConfig(next,'admin');
 const configVersion=add(CONFIG,JSON.stringify(next));
 const stable=read(['run','services','describe',SERVICE,'--region=us-central1']);
 if(stable.metadata?.generation!==state.metadata?.generation||stable.spec?.template?.spec?.containers?.[0]?.image!==image)failure('ADMIN_GITHUB_SERVICE_CHANGED_CONCURRENTLY');
 try{run(['run','services','update',SERVICE,'--project='+PROJECT,'--region=us-central1','--remove-env-vars=GITHUB_TOKEN','--update-secrets=GITHUB_TOKEN='+SECRET+':'+version,'--no-traffic','--quiet','--format=json(status.latestCreatedRevisionName)']);}
 catch(error){error.phase='runtime-secret-binding';throw error;}
 const candidate=read(['run','services','describe',SERVICE,'--region=us-central1']);
 if(candidate.spec?.template?.spec?.containers?.[0]?.image!==image)failure('ADMIN_GITHUB_IMAGE_CHANGED');
 const revision=candidate.status?.latestCreatedRevisionName;
 if(!revision||revision===body.revision)failure('ADMIN_GITHUB_CANDIDATE_MISSING');
 await activate({service:SERVICE,revision,commit:body.commit});
 const after=read(['run','services','describe',SERVICE,'--region=us-central1']);
 const binding=after.spec?.template?.spec?.containers?.[0]?.env?.find(e=>e.name==='GITHUB_TOKEN')?.valueFrom?.secretKeyRef;
 if(binding?.name!==SECRET||String(binding.key)!==version)failure('ADMIN_GITHUB_BINDING_NOT_VERIFIED');
 return {...evidence,stateChanged:true,revision,imageCommit:body.commit,secretVersion:version,configVersion};
}
function readVersion(raw,name){let value;try{value=JSON.parse(raw);}catch{failure('ADMIN_GITHUB_SECRET_VERSION_INVALID');}
 const match=value?.name?.match(new RegExp('^projects/[^/]+/secrets/'+name+'/versions/([1-9][0-9]*)$'));
 if(!match||value.state!=='ENABLED')failure('ADMIN_GITHUB_SECRET_VERSION_INVALID');return match[1];}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){syncAdminGitHubToken({apply:process.argv.includes('--apply')}).then(value=>console.log(JSON.stringify(value))).catch(error=>{console.error(JSON.stringify({error:/^ADMIN_GITHUB_[A-Z_]+$/.test(error.message)?error.message:'ADMIN_GITHUB_SYNC_FAILED',phase:['token-secret-write','runtime-config-write','runtime-secret-binding'].includes(error.phase)?error.phase:undefined,category:['permission_denied','not_found','quota_exceeded','command_failed','api_disabled','authentication_failed'].includes(error.code)?error.code:undefined}));process.exitCode=1;});}
