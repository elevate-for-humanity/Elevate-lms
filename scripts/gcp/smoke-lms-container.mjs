import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const memory=4*2**30;
const fail=code=>{throw Error('LMS_SMOKE_'+code);};
export async function smokeLmsContainer({sha,image=`elevate-lms:${sha}`,name=`lms-bounded-${process.pid}`,env=process.env,
 docker=args=>execFileSync('docker',args,{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}).trim(),
 request=fetch,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=Date.now}={}) {
 if(!/^[a-f0-9]{40}$/.test(sha??'')||!(image===`elevate-lms:${sha}`||/^us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/lms@sha256:[a-f0-9]{64}$/.test(image)))fail('EXACT_IMAGE_REQUIRED');
 if(!/^lms-bounded-[a-zA-Z0-9-]+$/.test(name))fail('CONTAINER_NAME_REQUIRED');
 let started=false;
 const inspect=()=>JSON.parse(docker(['inspect','--format={{json .}}',name]));
 const alive=()=>{const state=inspect();if(state.State?.Running!==true||state.State?.OOMKilled!==false||state.RestartCount!==0)fail('PROCESS_OR_MEMORY_FAILURE');return state;};
 try {
  const publicEnv=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter(key=>typeof env[key]==='string'&&env[key].trim()).flatMap(key=>['--env',key]);
  docker(['run','-d','--name',name,'--cpus=2','--memory=4g','--memory-swap=4g','-p','127.0.0.1::3000',
   '--env','PORT=3000','--env','HOSTNAME=0.0.0.0','--env','K_SERVICE=elevate-lms-migration',...publicEnv,image]);
  started=true;
  const config=alive().HostConfig;
  if(config?.Memory!==memory||config.MemorySwap!==memory||config.NanoCpus!==2e9)fail('RESOURCE_LIMIT_NOT_ENFORCED');
  const port=docker(['port',name,'3000/tcp']).split(':').at(-1);
  if(!/^\d+$/.test(port??''))fail('LOCAL_PORT_REQUIRED');
  const base=`http://127.0.0.1:${port}`;
  const get=(path,timeout=15000)=>request(base+path,{redirect:'manual',headers:{host:'app.elevateforhumanity.org','x-forwarded-host':'app.elevateforhumanity.org','x-forwarded-proto':'https'},signal:AbortSignal.timeout(timeout)});
  const identity=body=>body?.service==='lms'&&(body.commit??body.commitSha)===sha;
  let ready=false;
  const deadline=now()+120000;
  for(let attempt=0;attempt<60&&now()<deadline;attempt++) {
   alive();
   try {
    const r=await get('/api/ping',Math.max(1,Math.min(5000,deadline-now())));
    if(r.status===200){const b=await r.json();if(!identity(b)||b.ok!==true)fail('STARTUP_IDENTITY_UNVERIFIED');ready=true;break;}
    await r.body?.cancel();
   } catch(error) {
    if(/^LMS_SMOKE_/.test(error.message))throw error;
    if(!['TypeError','AbortError','TimeoutError'].includes(error.name))fail('STARTUP_RESPONSE_INVALID');
   }
   if(attempt<59)await delay(2000);
  }
  if(!ready)fail('STARTUP_UNVERIFIED');
  // Exercise real SSR under the same cgroup limits, without student data,
  // payment calls, credentials, or authenticated writes.
  for(let batch=0;batch<3;batch++) {
   await Promise.all(Array.from({length:4},async()=>{
    const response=await get('/login');const html=await response.text();
    if(response.status!==200||!response.headers.get('content-type')?.includes('text/html')||html.length<1000)fail('LOGIN_RENDER_FAILED');
   }));
   alive();
  }
  const protectedPage=await get('/lms');
  const login=new URL(protectedPage.headers.get('location')??'',base);
  if(![302,303,307,308].includes(protectedPage.status)||login.pathname!=='/login'||login.username||login.password||
   ![base,'https://app.elevateforhumanity.org','http://app.elevateforhumanity.org'].includes(login.origin))fail('GUEST_ACCESS_GATE_FAILED');
  await protectedPage.body?.cancel();
  for(const path of ['/api/ready','/api/health','/api/version']) {
   const response=await get(path),body=await response.json();
   if(response.status!==200||!identity(body))fail('EXACT_HEALTH_UNVERIFIED');
   if(path==='/api/ready'&&body.ready!==true)fail('READINESS_UNVERIFIED');
   if(path==='/api/health'&&(body.healthy!==true||body.ready!==true||body.configuration?.ok!==true||body.dependencies?.supabase?.ok!==true))fail('DEPENDENCY_HEALTH_UNVERIFIED');
  }
  alive();
  return {verified:true,commit:sha,cpu:2,memoryBytes:memory,renderedRequests:12,guestAccessDenied:true,exactHealthVerified:true,oomKilled:false};
 } finally {
  if(started)docker(['rm','-f',name]);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 smokeLmsContainer({sha:process.env.IMAGE_SHA||process.env.GITHUB_SHA,image:process.env.SMOKE_IMAGE,
  name:`lms-bounded-${process.env.GITHUB_RUN_ID||'local'}-${process.pid}`})
  .then(value=>console.log(JSON.stringify(value))).catch(error=>{console.error(/^LMS_SMOKE_[A-Z_]+$/.test(error.message)?error.message:'LMS_SMOKE_FAILED');process.exitCode=1;});
}
