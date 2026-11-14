import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../../',import.meta.url);
const strip=path=>stripTypeScriptTypes(readFileSync(new URL(path,root),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
const logger={warn(){},error(){}};
process.env.REDIS_URL='';process.env.UPSTASH_REDIS_REST_URL='';process.env.UPSTASH_REDIS_REST_TOKEN='';
const rateNames=['contactRateLimit','strictRateLimit','apiRateLimit','authRateLimit','paymentRateLimit','publicRateLimit','pageLoadRateLimit','createRateLimitHeaders','checkInMemoryRateLimit','getIdentifier','getRetryAfterSeconds'];
const rates=new Function('logger',strip('lib/rate-limit.ts')+';return {'+rateNames.join(',')+'};')(logger);
const {applyRateLimit}=new Function('NextResponse','logger',...rateNames,strip('lib/api/withRateLimit.ts')+';return {applyRateLimit};')(Response,logger,...rateNames.map(n=>rates[n]));
let operator='operator-a',deny=false,backendCalls=0,backendStatus=200;
const {GET,POST}=new Function('NextResponse','apiRequireDevStudio','applyRateLimit','getSecrets','requireAdminClient','recordMasterStudioArtifact','fetch',strip('apps/admin/app/api/admin/dev-studio/runtime/route.ts')+';return {GET,POST};')(
 Response,async()=>deny?{error:Response.json({error:'AUTH_REQUIRED'},{status:401})}:{id:operator},
 applyRateLimit,async()=>({STUDIO_BROWSER_URL:'https://runtime.example',STUDIO_BROWSER_SECRET:'test-secret'}),
 ()=>{throw Error('No run lookup is part of these requests');},()=>{throw Error('No artifact writes are part of these requests');},
 async(_url,options)=>{backendCalls++;if(options.headers['x-studio-operator-id'])assert.equal(options.headers['x-studio-operator-id'],operator);return Response.json(backendStatus===200?{id:'test-terminal',output:[],state:'running'}:{error:'private-runtime-detail'},{status:backendStatus});}
);
function request(operation,method='POST',ip='198.51.100.10'){
 const url='https://admin.example/api/admin/dev-studio/runtime'+(method==='GET'?'?operation='+operation+'&sessionId=test-terminal':'');
 const r=new Request(url,{method,headers:{'content-type':'application/json','x-forwarded-for':ip},...(method==='POST'?{body:JSON.stringify({operation,sessionId:'test-terminal',data:'pwd\\n',command:'pwd'})}:{})});
 Object.defineProperty(r,'nextUrl',{value:new URL(url)});return r;
}
test('normal terminal work does not exhaust the three-per-five-minute public strict bucket',async()=>{
 operator='terminal-interaction';
 for(let i=0;i<5;i++)assert.equal((await POST(request('terminal-input'))).status,200);
});

test('public strict limits remain unchanged outside the authenticated Studio scopes',async()=>{
 const r=new Request('https://public.example/api/contact',{headers:{'x-forwarded-for':'192.0.2.89'}});
 for(let i=0;i<3;i++)assert.equal(await applyRateLimit(r,'strict'),null);
 assert.equal((await applyRateLimit(r,'strict')).status,429);
 operator='unrelated-studio-operator';assert.equal((await POST(request('terminal-input'))).status,200);
});
test('explicit private scopes remain limited even if their key resembles an internal IP',async()=>{
 const r=new Request('https://admin.example/api/admin/dev-studio/runtime');
 for(let i=0;i<3;i++)assert.equal(await applyRateLimit(r,'strict',{key:'10.private-test-operator'}),null);
 assert.equal((await applyRateLimit(r,'strict',{key:'10.private-test-operator'})).status,429);
});

test('repository synchronization remains bounded independently of terminal commands and other operators',async()=>{
 operator='sync-owner-a';
 for(let i=0;i<3;i++)assert.equal((await POST(request('repository-sync'))).status,200);
 const blocked=await POST(request('repository-sync'));assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('Retry-After'))>0);
 assert.equal((await POST(request('terminal-input'))).status,200);
 operator='sync-owner-b';assert.equal((await POST(request('repository-sync'))).status,200);
});
test('output polling retains its rate bound and cannot evade it by changing IP addresses',async()=>{
 operator='poll-owner-a';
 for(let i=0;i<180;i++)assert.equal((await GET(request('terminal-output','GET'))).status,200);
 const before=backendCalls;
 assert.equal((await GET(request('terminal-output','GET','203.0.113.4'))).status,429);
 assert.equal(backendCalls,before);
 assert.equal((await POST(request('terminal-input'))).status,200);
 operator='poll-owner-b';assert.equal((await GET(request('terminal-output','GET'))).status,200);
});
test('unauthorized operators and unsupported commands never reach the runtime',async()=>{
 deny=true;const before=backendCalls;assert.equal((await POST(request('terminal-input'))).status,401);
 assert.equal((await GET(request('terminal-output','GET'))).status,401);assert.equal(backendCalls,before);
 deny=false;operator='invalid-operation';assert.equal((await POST(request('unsupported'))).status,400);assert.equal(backendCalls,before);
});

for(const status of [401,403])for(const method of ['GET','POST'])test(`private runtime HTTP ${status} on ${method} never masquerades as an expired Admin session`,async()=>{
 operator='upstream-auth-'+status+'-'+method;backendStatus=status;
 try{
  const before=backendCalls;
  const response=await (method==='GET'?GET:POST)(request(method==='GET'?'terminal-output':'terminal-input',method));
  assert.equal(response.status,503);
  const payload=await response.json();
  assert.equal(payload.error,'STUDIO_RUNTIME_AUTH_REJECTED');
  assert.ok(!JSON.stringify(payload).includes('private-runtime-detail'));
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.equal(backendCalls,before+1);
 }finally{backendStatus=200;}
});


test('unrelated public routes cannot consume each other rate-limit budget',async()=>{
 const ip='198.51.100.147';
 const a=new Request('https://www.elevateforhumanity.org/api/public/catalog',{headers:{'x-forwarded-for':ip}});
 const b=new Request('https://www.elevateforhumanity.org/api/public/programs',{headers:{'x-forwarded-for':ip}});
 for(let i=0;i<20;i++)assert.equal(await applyRateLimit(a,'public'),null);
 const blocked=await applyRateLimit(a,'public');
 assert.equal(blocked.status,429);
 assert.equal(blocked.headers.get('X-Elevate-Rate-Limit-Source'),'application');
 assert.equal(blocked.headers.get('Cache-Control'),'private, no-store');
 assert.equal(await applyRateLimit(b,'public'),null);
});
test('sensitive rate limits cannot be bypassed by changing API paths',async()=>{
 const ip='198.51.100.148';
 const first=new Request('https://www.elevateforhumanity.org/api/auth/step-one',{headers:{'x-forwarded-for':ip}});
 const second=new Request('https://www.elevateforhumanity.org/api/auth/step-two',{headers:{'x-forwarded-for':ip}});
 for(let i=0;i<20;i++)assert.equal(await applyRateLimit(first,'auth'),null);
 assert.equal((await applyRateLimit(second,'auth')).status,429);
});
