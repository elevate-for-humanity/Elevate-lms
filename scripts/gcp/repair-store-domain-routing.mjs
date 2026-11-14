import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {googleFailureCode} from './runtime-config.mjs';
const project='elegant-racer-299721',region='us-central1';
function cli(args) {
 try {return execFileSync('gcloud',[...args,'--project='+project,'--quiet','--format=json'],{encoding:'utf8',timeout:90000,stdio:['ignore','pipe','pipe']}).trim();}
 catch(error){const safe=String(error.stderr||'').replace(/Bearer\\s+\\S+/gi,'Bearer [REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]');console.error(JSON.stringify({operation:args.slice(0,3).join(' '),detail:safe.slice(0,2000)}));const code=googleFailureCode(safe);throw Object.assign(new Error(args.slice(0,3).join(' ')+': '+code),{code});}
}
const read=args=>JSON.parse(cli(args));
function existing(args){try{return read(args);}catch(error){if(error.code==='not_found')return null;throw error;}}
const before=read(['compute','url-maps','describe','elevate-public-routes','--global']);
assert.ok(before.defaultService.endsWith('/elevate-marketing-backend'));
const store=read(['run','services','describe','elevate-store-migration','--region='+region]);
assert.ok(store.status.conditions.some(x=>x.type==='Ready'&&x.status==='True'));
const template=read(['compute','backend-services','describe','elevate-marketing-backend','--global']);
const access=execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8',timeout:20000,stdio:['ignore','pipe','pipe']}).trim();
for(const path of ['certificateMaps/elevate-cert-map/certificateMapEntries','certificates','dnsAuthorizations']) {
 const response=await fetch('https://certificatemanager.googleapis.com/v1/projects/'+project+'/locations/global/'+path,{headers:{Authorization:'Bearer '+access},signal:AbortSignal.timeout(20000)});
 const b=await response.json();
 console.log(JSON.stringify({certificateResource:path,status:response.status,error:b.error?.status,entries:(b.certificateMapEntries||[]).map(x=>({name:x.name,hostname:x.hostname,certificates:x.certificates,state:x.state})),certificates:(b.certificates||[]).map(x=>({name:x.name,domains:x.managed?.domains,state:x.managed?.state})),authorizations:(b.dnsAuthorizations||[]).map(x=>({name:x.name,domain:x.domain,record:x.dnsResourceRecord}))}));
}
try {
 const r=await fetch('https://rdap.org/domain/elevateforhumanity.org',{signal:AbortSignal.timeout(20000)});
 const b=await r.json();
 console.log(JSON.stringify({registryStatus:r.status,registrar:(b.entities||[]).filter(x=>x.roles?.includes('registrar')).map(x=>({handle:x.handle,name:x.vcardArray?.[1]?.find(v=>v[0]==='fn')?.[3],links:x.links?.map(v=>v.href)}))}));
}catch{console.log(JSON.stringify({registryRead:'unavailable'}));}
let neg=existing(['compute','network-endpoint-groups','describe','elevate-store-neg','--region='+region]);
if(!neg) {
 cli(['compute','network-endpoint-groups','create','elevate-store-neg','--region='+region,'--network-endpoint-type=serverless','--cloud-run-service=elevate-store-migration']);
 neg=read(['compute','network-endpoint-groups','describe','elevate-store-neg','--region='+region]);
}
assert.equal(neg.cloudRun.service,'elevate-store-migration');
let backend=existing(['compute','backend-services','describe','elevate-store-backend','--global']);
if(!backend) {
 cli(['compute','backend-services','create','elevate-store-backend','--global','--protocol=HTTP','--load-balancing-scheme='+template.loadBalancingScheme,'--enable-logging','--logging-sample-rate=1']);
 backend=read(['compute','backend-services','describe','elevate-store-backend','--global']);
}
if(!(backend.backends||[]).length) cli(['compute','backend-services','add-backend','elevate-store-backend','--global','--network-endpoint-group=elevate-store-neg','--network-endpoint-group-region='+region]);
backend=read(['compute','backend-services','describe','elevate-store-backend','--global']);
assert.equal(backend.backends.length,1);assert.ok(backend.backends[0].group.endsWith('/elevate-store-neg'));
const rules=before.hostRules||[];
const current=rules.find(x=>x.hosts.includes('store.elevateforhumanity.org'));
if(!current) {
 assert.ok(!(before.pathMatchers||[]).some(x=>x.name==='store'),'Existing Store matcher requires inspection');
 cli(['compute','url-maps','add-path-matcher','elevate-public-routes','--global','--path-matcher-name=store','--default-service=elevate-store-backend','--new-hosts=store.elevateforhumanity.org']);
}
const after=read(['compute','url-maps','describe','elevate-public-routes','--global']);
assert.equal(after.defaultService,before.defaultService);
for(const rule of rules.filter(x=>!x.hosts.includes('store.elevateforhumanity.org'))) assert.ok(after.hostRules.some(x=>JSON.stringify(x)===JSON.stringify(rule)),'An existing host route changed');
for(const matcher of before.pathMatchers||[]) assert.ok(after.pathMatchers.some(x=>JSON.stringify(x)===JSON.stringify(matcher)),'An existing path matcher changed');
const rule=after.hostRules.find(x=>x.hosts.includes('store.elevateforhumanity.org'));
assert.ok(after.pathMatchers.find(x=>x.name===rule.pathMatcher).defaultService.endsWith('/elevate-store-backend'));
console.log(JSON.stringify({storeGoogleRoute:'verified',hostRule:rule,backend:backend.name,neg:neg.name,otherRoutes:'preserved'}));
console.log(JSON.stringify({dnsChangeRequired:{type:'CNAME',name:'store',target:'www.elevateforhumanity.org',oldTarget:'store.elevateforhumanity.org.elev-5vfk.dns.northflank.app'},publicCutover:'not_verified_until_DNS_and_TLS_pass'}));

const aliasRoutes=[
 {hosts:['portal.elevateforhumanity.org','dashboard.elevateforhumanity.org'],owner:'app.elevateforhumanity.org',expected:'lms'},
 {hosts:['dev-studio.elevateforhumanity.org'],owner:'admin.elevateforhumanity.org',expected:'admin'},
];
for(const item of aliasRoutes) {
 const owner=after.hostRules.find(x=>x.hosts.includes(item.owner));
 assert.ok(owner,'Missing verified canonical owner '+item.owner);
 for(const host of item.hosts) {
  const live=read(['compute','url-maps','describe','elevate-public-routes','--global']);
  const rule=live.hostRules.find(x=>x.hosts.includes(host));
  if(rule) assert.equal(rule.pathMatcher,owner.pathMatcher,'Alias has a conflicting owner '+host);
  else cli(['compute','url-maps','add-host-rule','elevate-public-routes','--global','--hosts='+host,'--path-matcher-name='+owner.pathMatcher]);
 }
}
let live=read(['compute','url-maps','describe','elevate-public-routes','--global']);
const testing=live.hostRules.find(x=>x.hosts.includes('testing.elevateforhumanity.org'));
if(!testing) cli(['compute','url-maps','add-path-matcher','elevate-public-routes','--global','--path-matcher-name=testing-public','--default-service=elevate-marketing-backend','--new-hosts=testing.elevateforhumanity.org']);
live=read(['compute','url-maps','describe','elevate-public-routes','--global']);
for(const original of after.hostRules) assert.ok(live.hostRules.some(x=>JSON.stringify(x)===JSON.stringify(original)),'Original host rule changed');
for(const original of after.pathMatchers) assert.ok(live.pathMatchers.some(x=>JSON.stringify(x)===JSON.stringify(original)),'Original matcher changed');
for(const [host,expected] of [
 ['store.elevateforhumanity.org','store'],['portal.elevateforhumanity.org','lms'],['dashboard.elevateforhumanity.org','lms'],['testing.elevateforhumanity.org','marketing'],['dev-studio.elevateforhumanity.org','admin']
]) {
 let verified=false;
 for(let attempt=0;attempt<12&&!verified;attempt++){
  try{
   const output=execFileSync('curl',['--silent','--show-error','--connect-timeout','10','--max-time','20','--resolve',host+':443:34.110.235.233','--write-out','HTTP_STATUS:%{http_code}','https://'+host+'/api/health'],{encoding:'utf8',timeout:25000,stdio:['ignore','pipe','pipe']});
   const marker=output.lastIndexOf('HTTP_STATUS:');const status=Number(output.slice(marker+12));const body=JSON.parse(output.slice(0,marker).trim());
   verified=status===200&&body.service===expected&&body.healthy===true;
   console.log(JSON.stringify({googleAlias:host,expected,status,service:body.service,healthy:body.healthy,tlsVerified:true,verified}));
  }catch{console.log(JSON.stringify({googleAlias:host,verified:false,attempt}));}
  if(!verified)await new Promise(resolve=>setTimeout(resolve,5000));
 }
 assert.ok(verified,'Google alias did not pass strict TLS and identity '+host);
}
